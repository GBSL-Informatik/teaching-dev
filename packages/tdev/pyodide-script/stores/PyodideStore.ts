import { action, computed, observable, runInAction } from 'mobx';
import * as Comlink from 'comlink';
import type { SquareWorker, WorkerApi } from '../workers/square.worker';
import ViewStore from '@tdev-stores/ViewStores';
import { PyWorker, PyWorkerApi } from '../workers/pyodide.worker';
import ExecutionEnvironment from '@docusaurus/ExecutionEnvironment';

const PY_INPUT = 'PY_INPUT' as const;
const PY_AWAIT_INPUT = 'PY_AWAIT_INPUT' as const;
const PY_CANCEL_INPUT = 'PY_CANCEL_INPUT' as const;
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

const TimingServiceWorker =
    ExecutionEnvironment.canUseDOM && 'serviceWorker' in navigator
        ? navigator.serviceWorker.register(new URL('../workers/service.worker.ts', import.meta.url), {
              type: 'module'
          })
        : null;

export default class PyodideStore {
    viewStore: ViewStore;
    @observable.ref accessor squareWorker: Comlink.Remote<SquareWorker> | null = null;
    @observable.ref accessor pyWorker: Comlink.Remote<PyWorker> | null = null;
    @observable.ref accessor _serviceWorkerRegistration: ServiceWorker | null = null;
    awaitingInputIds = observable.set<string>();
    awaitingInputPrompt = observable.map<string, string | null>();
    logs = observable.array<string>([]);
    constructor(viewStore: ViewStore) {
        this.viewStore = viewStore;
        this.initialize();
    }

    @action
    runCode(code: string) {
        this.logs.clear();
        if (!this.pyWorker) {
            this.logs.push('Pyodide is not initialized yet.');
            return;
        }
        return this.pyWorker.run(
            code,
            Comlink.proxy((message) => {
                switch (message.type) {
                    case 'log':
                        runInAction(() => {
                            this.logs.push(message.message);
                        });
                        break;
                    default:
                        break;
                }
            }),
            Comlink.proxy((question) => {
                const answer = window.prompt(question || 'Input required:');
                return answer || '';
            })
        );
    }

    @computed
    get log() {
        return this.logs.join('\n');
    }

    @computed
    get isInitialized() {
        return this.squareWorker !== null;
    }

    @computed
    get currentPromptId() {
        if (this.awaitingInputIds.size === 0) {
            return null;
        }
        return Array.from(this.awaitingInputIds)[0];
    }

    @action
    cancelCodeExecution() {
        console.log('Cancelling code execution', ...this.awaitingInputIds);
        if (!this._serviceWorkerRegistration) {
            console.error('No service worker registration');
            return;
        }
        const id = this.currentPromptId;
        if (!id) {
            console.error('No current prompt id to cancel');
            return;
        }
        this._serviceWorkerRegistration.postMessage({
            type: PY_CANCEL_INPUT,
            id: id,
            value: ''
        });
        this.awaitingInputIds.delete(id);
        this.awaitingInputPrompt.delete(id);
    }

    @action
    sendInputResponse(id: string, value: string) {
        console.log([...this.awaitingInputIds], id, value);
        if (!this.awaitingInputIds.has(id)) {
            console.error('Worker not awaiting input');
            return;
        }
        if (!this._serviceWorkerRegistration) {
            console.error('No service worker registration');
            return;
        }
        this._serviceWorkerRegistration.postMessage({
            type: PY_INPUT,
            id,
            value
        });
        this.awaitingInputIds.delete(id);
        this.awaitingInputPrompt.delete(id);
    }

    async initialize() {
        if (!ComSquareWorker || !ComPyWorker || !TimingServiceWorker) {
            return;
        }
        await this.registerServiceWorker();
        const libs = await Promise.all([new ComSquareWorker(), new ComPyWorker()]);
        runInAction(() => {
            this.squareWorker = libs[0];
            this.pyWorker = libs[1];
        });
    }

    async registerServiceWorker() {
        if (!TimingServiceWorker) {
            console.error('Service workers are not supported in this environment.');
            return;
        }
        try {
            const registration = await TimingServiceWorker;
            if (!registration.active) {
                console.warn('Service worker registration not active yet.');
                return;
            }
            runInAction(() => {
                this._serviceWorkerRegistration = registration.active!;
            });

            registration.addEventListener('updatefound', () => {
                const installingWorker = registration.installing;
                if (installingWorker) {
                    console.debug('Installing new service worker');
                    installingWorker.addEventListener('statechange', () => {
                        if (installingWorker.state === 'installed') {
                            console.debug('New service worker installed');
                            runInAction(() => {
                                this._serviceWorkerRegistration = registration.active;
                            });
                        }
                    });
                }
            });
            console.log('Service worker registered with scope:', registration.scope);

            navigator.serviceWorker.onmessage = (event) => {
                switch (event.data.type) {
                    case PY_AWAIT_INPUT:
                        if (event.source instanceof ServiceWorker) {
                            // Update the service worker reference, in case the service worker is different to the one we registered
                            this._serviceWorkerRegistration = registration.active;
                        }
                        console.log('Python code is awaiting input:', event.data.id, event.data.prompt);
                        runInAction(() => {
                            this.awaitingInputPrompt.set(event.data.id, event.data.prompt);
                            this.awaitingInputIds.add(event.data.id);
                        });
                        break;
                }
            };
        } catch (error) {
            console.error('Service worker registration failed:', error);
        }
    }
}
