import { action, computed, observable, runInAction } from 'mobx';
import * as Comlink from 'comlink';
import ViewStore from '@tdev-stores/ViewStores';
import { PyWorker, PyWorkerApi } from '../workers/pyodide.worker';
import ExecutionEnvironment from '@docusaurus/ExecutionEnvironment';
import { PY_AWAIT_INPUT, PY_CANCEL_ALL, PY_CANCEL_INPUT, PY_INPUT } from '../config';
import PyodideCode from '../models/PyodideCode';
import siteConfig from '@generated/docusaurus.config';
import { Message } from '@tdev/pyodide-code/pyodideJsModules';
import SessionStorage from '@tdev-stores/utils/SessionStorage';
const BASE_URL = siteConfig.baseUrl || '/';

declare module '@tdev-stores/utils/SessionStorage' {
    export interface StorageKey {
        PyodideSwReloadCount: 'pyodideSwReloadCount';
    }
}

const TimingServiceWorker =
    ExecutionEnvironment.canUseDOM && 'serviceWorker' in navigator
        ? navigator.serviceWorker.register(`${BASE_URL}pyodide.sw.js`, {
              scope: BASE_URL,
              type: 'module'
          })
        : null;

export default class PyodideStore {
    viewStore: ViewStore;
    _worker: Worker | null = null;
    @observable accessor runtimeId = Date.now();
    @observable.ref accessor pyWorker: Comlink.Remote<PyWorker> | null = null;
    @observable.ref accessor _serviceWorkerRegistration: ServiceWorker | null = null;
    awaitingInputPrompt = observable.map<string, string | null>();
    constructor(viewStore: ViewStore) {
        this.viewStore = viewStore;
        this.initialize();
    }

    @action
    async run(code: PyodideCode) {
        if (code.isExecuting) {
            await this.recreatePyWorker();
        }

        code.clearMessages();
        code.setRuntimeId(this.runtimeId);
        if (!this.pyWorker) {
            code.addLogMessage({
                type: 'error',
                message: 'Python worker is not initialized.',
                id: code.id,
                timeStamp: Date.now()
            });
            return;
        }
        const sendMessage = Comlink.proxy(
            action((message: Message) => {
                this.handleMessage(code, message);
            })
        );
        return this.pyWorker
            .run(code.id, code.combinedCode, sendMessage, code.title)
            .then((message) => {
                if (message && !(message.type === 'log' && message.message === undefined)) {
                    this.handleMessage(code, message);
                }
            })
            .finally(() => {
                runInAction(() => {
                    code.setRuntimeId(null);
                });
            });
    }

    @action
    handleMessage(code: PyodideCode, message: Message) {
        switch (message.type) {
            case 'log':
                code.addLogMessage(message);
                break;
            case 'error':
                code.addLogMessage(message);
                break;
            default:
                if ('handleMessage' in this.viewStore.root.siteStore) {
                    this.viewStore.root.siteStore.handleMessage('pyodide', message);
                }
                break;
        }
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
    cancelAllCodeExecutions() {
        if (!this._serviceWorkerRegistration) {
            console.error('No service worker registration');
            return;
        }
        this.awaitingInputPrompt.clear();
        this._serviceWorkerRegistration.postMessage({
            type: PY_CANCEL_ALL,
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

    @action
    createPyWorker() {
        if (!ExecutionEnvironment.canUseDOM) {
            return null;
        }
        if (this._worker) {
            this._worker.terminate();
        }
        this._worker = new Worker(new URL('@tdev/pyodide-code/workers/pyodide.worker', import.meta.url), {
            type: 'module'
        });
        return Comlink.wrap<PyWorkerApi>(this._worker);
    }

    @action
    async recreatePyWorker() {
        if (this.awaitingInputPrompt.size > 0) {
            this.cancelAllCodeExecutions();
        }
        this.pyWorker = null;
        this.runtimeId = Date.now(); // this will automatically stop all running scripts
        return await this.initialize(true);
    }

    async initialize(skipSWRegistration = false) {
        const ComPyWorker = this.createPyWorker();
        if (!TimingServiceWorker || !ComPyWorker) {
            console.error(
                'Cannot initialize PyodideStore: missing service worker or worker creation failed.'
            );
            return;
        }
        if (!skipSWRegistration) {
            await this.registerServiceWorker();
        }
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
                const reloadCount = SessionStorage.get('PyodideSwReloadCount', 0) ?? 0;
                if (reloadCount < 1) {
                    SessionStorage.set('PyodideSwReloadCount', reloadCount + 1);
                    window.location.reload();
                }
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

            window.addEventListener('beforeunload', () => {
                if (this._serviceWorkerRegistration) {
                    this.cancelAllCodeExecutions();
                }
            });

            navigator.serviceWorker.onmessage = (event) => {
                switch (event.data.type) {
                    case PY_AWAIT_INPUT:
                        if (event.source instanceof ServiceWorker) {
                            // Update the service worker reference, in case the service worker is different to the one we registered
                            this._serviceWorkerRegistration = registration.active;
                        }
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
