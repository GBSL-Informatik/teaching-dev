import { computed, observable, runInAction } from 'mobx';
import * as Comlink from 'comlink';
import type { SquareWorker, WorkerApi } from '../workers/square.worker';
import ViewStore from '@tdev-stores/ViewStores';
import { PyWorker, PyWorkerApi } from '../workers/pyodide.worker';
import ExecutionEnvironment from '@docusaurus/ExecutionEnvironment';
const ComSquareWorker = ExecutionEnvironment.canUseDOM
    ? Comlink.wrap<WorkerApi>(
          new Worker(new URL('../workers/square.worker.ts', import.meta.url), { type: 'module' })
      )
    : null;
const ComPyWorker = ExecutionEnvironment.canUseDOM
    ? Comlink.wrap<PyWorkerApi>(
          new Worker(new URL('../workers/pyodide.worker.ts', import.meta.url), { type: 'module' })
      )
    : null;

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
        if (!ComSquareWorker || !ComPyWorker) {
            return;
        }
        const libs = await Promise.all([new ComSquareWorker(), new ComPyWorker()]);
        runInAction(() => {
            this.squareWorker = libs[0];
            this.pyWorker = libs[1];
        });
    }
}
