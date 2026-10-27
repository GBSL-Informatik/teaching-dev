import { ModuleWorker } from '@tdev/pyodide-code/workers/ModuleWorker';
import type { PyWorker, PyWorkerApi } from '../workers/pyodide.worker';
import * as Comlink from 'comlink';
import { withTimeout } from '../helpers/withTimeout';

export default class PyodideRuntime {
    readonly worker: Worker;
    readonly api: Promise<Comlink.Remote<PyWorker>>;
    readonly stopped: Promise<void>;
    readonly failed: Promise<never>;
    isUsable = true;
    private resolveStopped!: () => void;
    private rejectFailure!: (error: Error) => void;

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
        // Manual recreation warms the worker before the next execution observes loading failures.
        void this.api.catch(() => {});
    }

    terminate() {
        this.isUsable = false;
        this.worker.terminate();
        this.resolveStopped();
    }

    fail(error: Error) {
        this.isUsable = false;
        this.rejectFailure(error);
    }
}
