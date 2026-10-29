import { action, observable } from 'mobx';
import {
    eventSourceKey,
    MAX_PENDING_EVENTS,
    type EventSource,
    type ExecutionEventSource,
    type WebEvent
} from '../events';
import type PyodideCode from '../models/PyodideCode';
import type PyodideStore from './PyodideStore';

interface Subscription {
    code: PyodideCode;
    executionId: number;
}

export default class ExtensionEventStore {
    private readonly store: PyodideStore;
    private readonly subscriptions = observable.map<string, Subscription>([], { deep: false });
    private readonly pendingDeliveries = new Map<number, number>();

    constructor(store: PyodideStore) {
        this.store = store;
    }

    isConnected(source: EventSource): boolean {
        return this.subscriptions.has(eventSourceKey(source));
    }

    @action
    open(code: PyodideCode, executionId: number, sources: readonly ExecutionEventSource[]) {
        if (this.store.executions.get(code.id) !== executionId) {
            throw new Error('This Python execution is no longer active.');
        }
        for (const source of sources) {
            if (source.executionId !== executionId) {
                throw new Error('Cannot subscribe with an expired event source.');
            }
            const owner = this.subscriptions.get(eventSourceKey(source));
            if (owner && owner.executionId !== executionId) {
                throw new Error(
                    `Pyodide event source "${source.extension}/${source.targetId}" already has a running controller.`
                );
            }
        }
        for (const source of sources) {
            this.subscriptions.set(eventSourceKey(source), { code, executionId });
        }
    }

    @action
    close(editorId: string, executionId: number) {
        for (const [key, owner] of this.subscriptions) {
            if (owner.code.id === editorId && owner.executionId === executionId) {
                this.subscriptions.delete(key);
            }
        }
        this.pendingDeliveries.delete(executionId);
    }

    async emit<Payload>(source: EventSource, event: WebEvent<Payload>): Promise<'accepted' | 'inactive'> {
        const owner = this.subscriptions.get(eventSourceKey(source));
        if (!owner || this.store.executions.get(owner.code.id) !== owner.executionId) {
            return 'inactive';
        }
        const pending = this.pendingDeliveries.get(owner.executionId) ?? 0;
        if (pending >= MAX_PENDING_EVENTS) {
            this.fail(owner, new Error('Too many pending browser events. Run the Python script again.'));
            return 'inactive';
        }
        this.pendingDeliveries.set(owner.executionId, pending + 1);
        try {
            const result = await this.store.deliverEvent({
                editorId: owner.code.id,
                executionId: owner.executionId,
                extension: source.extension,
                targetId: source.targetId,
                timeStamp: Date.now(),
                event
            });
            if (result === 'overflow') {
                throw new Error('Python event queue is full. Run the script again.');
            }
            return result;
        } catch (error: unknown) {
            this.fail(owner, error);
            return 'inactive';
        } finally {
            this.finishDelivery(owner.executionId);
        }
    }

    private finishDelivery(executionId: number) {
        const pending = this.pendingDeliveries.get(executionId);
        if (pending === undefined) {
            return;
        }
        if (pending <= 1) {
            this.pendingDeliveries.delete(executionId);
            return;
        }
        this.pendingDeliveries.set(executionId, pending - 1);
    }

    @action
    private fail(owner: Subscription, error: unknown) {
        if (this.store.executions.get(owner.code.id) !== owner.executionId) {
            return;
        }
        owner.code.addLogMessage({
            type: 'error',
            message: error instanceof Error ? error.message : String(error),
            id: owner.code.id,
            timeStamp: Date.now()
        });
        this.store.stopExecution(owner.code.id);
        owner.code.setRuntimeId(null);
    }
}
