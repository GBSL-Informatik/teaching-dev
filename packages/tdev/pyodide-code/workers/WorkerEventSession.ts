import {
    eventSourceKey,
    MAX_PENDING_EVENTS,
    type EventDeliveryResult,
    type ExecutionEvent,
    type ExecutionEventSource
} from '../events';
import type { Context } from '../messages';

interface EventContext extends Context {
    id: string;
    executionId: number;
}

export default class WorkerEventSession {
    private readonly sources = new Set<string>();
    private readonly queue: ExecutionEvent[] = [];
    private receiver?: (event: ExecutionEvent | undefined) => void;
    private opened = false;
    private closed = false;
    private listening = false;

    constructor(
        private readonly context: EventContext,
        private readonly extensionNames: readonly string[]
    ) {}

    source(extension: string, targetId: string): ExecutionEventSource {
        if (this.closed) {
            throw new Error('This Python event session has ended. Run the script again.');
        }
        if (typeof targetId !== 'string' || !targetId) {
            throw new Error('An event source needs a non-empty target ID.');
        }
        return Object.freeze({ extension, targetId, executionId: this.context.executionId });
    }

    async open(sourcesJson: string) {
        if (this.opened || this.closed) {
            throw new Error('Only one webio.run() call is allowed per execution.');
        }
        const sources = this.parseSources(sourcesJson);
        this.opened = true;
        for (const source of sources) {
            this.sources.add(eventSourceKey(source));
        }
        this.listening = true;
        try {
            await this.context.sendMessage({
                type: 'event-subscriptions',
                id: this.context.id,
                executionId: this.context.executionId,
                operation: 'open',
                sources
            });
        } catch (error) {
            this.stop();
            throw error;
        }
    }

    deliver(event: ExecutionEvent): EventDeliveryResult {
        if (
            !this.listening ||
            event.editorId !== this.context.id ||
            event.executionId !== this.context.executionId ||
            !this.sources.has(eventSourceKey(event))
        ) {
            return 'inactive';
        }
        if (this.receiver) {
            const receive = this.receiver;
            this.receiver = undefined;
            receive(event);
            return 'accepted';
        }
        if (this.queue.length >= MAX_PENDING_EVENTS) {
            return 'overflow';
        }
        this.queue.push(event);
        return 'accepted';
    }

    nextEvent(): Promise<ExecutionEvent | undefined> {
        if (!this.listening) {
            return Promise.resolve(undefined);
        }
        const event = this.queue.shift();
        if (event) {
            return Promise.resolve(event);
        }
        if (this.receiver) {
            throw new Error('Only one event receiver is allowed per execution.');
        }
        return new Promise((resolve) => {
            this.receiver = resolve;
        });
    }

    stop() {
        this.listening = false;
        this.queue.length = 0;
        this.receiver?.(undefined);
        this.receiver = undefined;
    }

    async close() {
        if (this.closed) {
            return;
        }
        this.closed = true;
        this.stop();
        if (!this.opened) {
            return;
        }
        await this.context.sendMessage({
            type: 'event-subscriptions',
            id: this.context.id,
            executionId: this.context.executionId,
            operation: 'close',
            sources: []
        });
    }

    private parseSources(json: string): ExecutionEventSource[] {
        const sources: unknown = JSON.parse(json);
        if (!Array.isArray(sources) || sources.length === 0) {
            throw new Error('Register at least one event handler before calling webio.run().');
        }
        return sources.map((source: unknown) => {
            if (
                !source ||
                typeof source !== 'object' ||
                !('extension' in source) ||
                typeof source.extension !== 'string' ||
                !this.extensionNames.includes(source.extension) ||
                !('targetId' in source) ||
                typeof source.targetId !== 'string' ||
                !source.targetId ||
                !('executionId' in source) ||
                source.executionId !== this.context.executionId
            ) {
                throw new Error('Invalid or expired event source. Create the handle in this execution.');
            }
            return {
                extension: source.extension,
                targetId: source.targetId,
                executionId: this.context.executionId
            };
        });
    }
}
