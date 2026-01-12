import { action, computed, observable, runInAction } from 'mobx';
import * as Comlink from 'comlink';
import ViewStore from '@tdev-stores/ViewStores';
import { PyWorker, PyWorkerApi } from '../workers/pyodide.worker';
import ExecutionEnvironment from '@docusaurus/ExecutionEnvironment';
import { PY_AWAIT_INPUT, PY_CANCEL_INPUT, PY_INPUT } from '../config';
import PyodideScript from '../models';

const ComPyWorker = ExecutionEnvironment.canUseDOM
    ? Comlink.wrap<PyWorkerApi>(
          new Worker(new URL('../workers/pyodide.worker', import.meta.url), { type: 'module' })
      )
    : null;
const TimingServiceWorker =
    ExecutionEnvironment.canUseDOM && 'serviceWorker' in navigator
        ? navigator.serviceWorker.register('/pyodide.sw.js', {
              scope: '/',
              type: 'module'
          })
        : null;

export default class PyodideStore {
    viewStore: ViewStore;
    @observable.ref accessor pyWorker: Comlink.Remote<PyWorker> | null = null;
    @observable.ref accessor _serviceWorkerRegistration: ServiceWorker | null = null;
    awaitingInputPrompt = observable.map<string, string | null>();
    constructor(viewStore: ViewStore) {
        this.viewStore = viewStore;
        this.initialize();
    }

    @action
    run(code: PyodideScript) {
        code.clearLogMessages();
        if (!this.pyWorker) {
            code.addLogMessage({
                type: 'error',
                message: 'Python worker is not initialized.',
                id: code.id,
                timeStamp: Date.now()
            });
            return;
        }
        return this.pyWorker.run(
            code.id,
            code.code,
            Comlink.proxy((message) => {
                switch (message.type) {
                    case 'log':
                        runInAction(() => {
                            code.addLogMessage(message);
                        });
                        break;
                    default:
                        break;
                }
            })
        );
    }

    @computed
    get isInitialized() {
        return this.pyWorker !== null;
    }

    @action
    cancelCodeExecution(id: string) {
        if (!this._serviceWorkerRegistration) {
            console.error('No service worker registration');
            return;
        }
        if (!id) {
            console.error('No current prompt id to cancel');
            return;
        }
        this.awaitingInputPrompt.delete(id);
        this._serviceWorkerRegistration.postMessage({
            type: PY_CANCEL_INPUT,
            id: id,
            value: ''
        });
    }

    @action
    sendInputResponse(id: string, value: string) {
        if (!this.awaitingInputPrompt.has(id)) {
            console.error('Worker not awaiting input');
            return;
        }
        if (!this._serviceWorkerRegistration) {
            console.error('No service worker registration');
            return;
        }
        this.awaitingInputPrompt.delete(id);
        this._serviceWorkerRegistration.postMessage({
            type: PY_INPUT,
            id,
            value
        });
    }

    async initialize() {
        if (!ComPyWorker || !TimingServiceWorker) {
            return;
        }
        await this.registerServiceWorker();
        const pyWorker = await new ComPyWorker();
        runInAction(() => {
            this.pyWorker = pyWorker;
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
            navigator.serviceWorker.ready.then((reg) => {
                console.log('Service worker ready with scope:', reg.scope);
            });

            navigator.serviceWorker.onmessage = (event) => {
                console.log(event);
                switch (event.data.type) {
                    case PY_AWAIT_INPUT:
                        if (event.source instanceof ServiceWorker) {
                            // Update the service worker reference, in case the service worker is different to the one we registered
                            this._serviceWorkerRegistration = registration.active;
                        }
                        console.log('Python code is awaiting input:', event.data.id, event.data.prompt);
                        runInAction(() => {
                            this.awaitingInputPrompt.set(event.data.id, event.data.prompt);
                        });
                        break;
                }
            };
        } catch (error) {
            console.error('Service worker registration failed:', error);
        }
    }
}
