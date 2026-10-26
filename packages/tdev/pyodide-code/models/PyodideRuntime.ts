import { ModuleWorker } from '@tdev/pyodide-code/workers/ModuleWorker';
import type { PyWorker, PyWorkerApi } from '../workers/pyodide.worker';
import * as Comlink from 'comlink';

export default class PyodideRuntime {
    readonly worker: Worker;
    readonly api: Promise<Comlink.Remote<PyWorker>>;
    readonly stopped: Promise<void>;
    private resolveStopped!: () => void;

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
        const WorkerApi = Comlink.wrap<PyWorkerApi>(this.worker);
        this.api = Promise.resolve(new WorkerApi());
    }

    terminate() {
        this.worker.terminate();
        this.resolveStopped();
    }
}
