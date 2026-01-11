import { computed, observable, runInAction } from 'mobx';
import * as Comlink from 'comlink';
import type { SquareWorker, WorkerApi } from '../workers/square.worker';
import ViewStore from '@tdev-stores/ViewStores';
import { PyWorker, PyWorkerApi } from '../workers/pyodide.worker';
const ComSquareWorker = Comlink.wrap<WorkerApi>(
    new Worker(new URL('../workers/square.worker.ts', import.meta.url), { type: 'module' })
);
const ComPyWorker = Comlink.wrap<PyWorkerApi>(
    new Worker(new URL('../workers/pyodide.worker.ts', import.meta.url), { type: 'module' })
);

export default class PyodideStore {
    viewStore: ViewStore;
    @observable.ref accessor squareWorker: Comlink.Remote<SquareWorker> | null = null;
    @observable.ref accessor pyWorker: Comlink.Remote<PyWorker> | null = null;
    constructor(viewStore: ViewStore) {
        this.viewStore = viewStore;
        this.initialize();
    }

    @computed
    get isInitialized() {
        return this.squareWorker !== null;
    }

    async initialize() {
        const libs = await Promise.all([new ComSquareWorker(), new ComPyWorker()]);
        runInAction(() => {
            this.squareWorker = libs[0];
            this.pyWorker = libs[1];
        });
    }
}
