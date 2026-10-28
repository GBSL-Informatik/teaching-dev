import { ModuleWorker } from '@tdev/pyodide-code/workers/ModuleWorker';
import type { PyWorker, PyWorkerApi } from '../workers/pyodide.worker';
import * as Comlink from 'comlink';
import { withTimeout } from '../helpers/withTimeout';
import type { EventDeliveryResult, ExecutionEvent } from '../events';

export default class PyodideRuntime {
    readonly worker: Worker;
    readonly api: Promise<Comlink.Remote<PyWorker>>;
    readonly stopped: Promise<void>;
    readonly failed: Promise<never>;
    isUsable = true;
    private resolveStopped!: () => void;
    private rejectFailure!: (error: Error) => void;
    private readonly pendingEvents = new Set<(error?: Error) => void>();

    constructor() {
        this.stopped = new Promise((resolve) => {
            this.resolveStopped = resolve;
        });
        this.worker = new ModuleWorker(
            new URL(
                /* webpackChunkName: "pyodide-worker" */
                // Plugin uses this name to prevent worker splitting.
                '@tdev/pyodide-code/workers/pyodide.worker',
                import.meta.url
            )
        ).worker;
        this.failed = new Promise((_, reject) => {
            this.rejectFailure = reject;
            this.worker.addEventListener('error', (event) => {
                this.fail(new Error(event.message || 'Python worker failed.'));
            });
            this.worker.addEventListener('messageerror', () => {
                this.fail(new Error('Python worker could not deserialize a message.'));
            });
        });
        const WorkerApi = Comlink.wrap<PyWorkerApi>(this.worker);
        const ready = Promise.resolve(new WorkerApi()).then(async (api) => {
            await api.ready();
            return api;
        });
        this.api = withTimeout(
            Promise.race([
                ready,
                this.failed,
                this.stopped.then(() => {
                    throw new Error('Python runtime stopped.');
                })
            ]),
            30000,
            'Python runtime loading timed out. Check the network and retry.'
        );
        // Cancellation warms a replacement before the next execution observes loading failures.
        void this.api.catch(() => {
            this.isUsable = false;
        });
    }

    deliverEvent(event: ExecutionEvent): Promise<EventDeliveryResult> {
        if (!this.isUsable) {
            return Promise.resolve('inactive');
        }
        return new Promise((resolve, reject) => {
            const finish = (result: EventDeliveryResult) => {
                this.pendingEvents.delete(cancel);
                resolve(result);
            };
            const fail = (error: unknown) => {
                this.pendingEvents.delete(cancel);
                reject(error);
            };
            const cancel = (error?: Error) => {
                if (error) {
                    fail(error);
                } else {
                    finish('inactive');
                }
            };
            this.pendingEvents.add(cancel);
            this.api
                .then((api) => {
                    if (!this.pendingEvents.has(cancel)) {
                        return 'inactive' as const;
                    }
                    return api.deliverEvent(event);
                })
                .then(finish, fail);
        });
    }

    terminate() {
        this.isUsable = false;
        this.worker.terminate();
        this.finishPendingEvents();
        this.resolveStopped();
    }

    fail(error: Error) {
        this.isUsable = false;
        this.finishPendingEvents(error);
        this.rejectFailure(error);
    }

    private finishPendingEvents(error?: Error) {
        for (const cancel of this.pendingEvents) {
            cancel(error);
        }
    }
}
