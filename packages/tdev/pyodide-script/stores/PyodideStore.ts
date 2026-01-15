import { action, computed, observable, runInAction } from 'mobx';
import * as Comlink from 'comlink';
import ViewStore from '@tdev-stores/ViewStores';
import { PyWorker, PyWorkerApi } from '../workers/pyodide.worker';
import ExecutionEnvironment from '@docusaurus/ExecutionEnvironment';
import { Message, PY_AWAIT_INPUT, PY_CANCEL_INPUT, PY_INPUT } from '../config';
import PyodideScript from '../models/PyodideScript';
import siteConfig from '@generated/docusaurus.config';
const BASE_URL = siteConfig.baseUrl || '/';

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
    run(code: PyodideScript) {
        code.clearLogMessages();
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
            .run(code.id, code.code, sendMessage, '', {})
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
    handleMessage(code: PyodideScript, message: Message) {
        switch (message.type) {
            case 'log':
                code.addLogMessage(message);
                break;
            case 'error':
                code.addLogMessage(message);
                break;
            // case 'clock':
            //     const clock = this.viewStore.root.siteStore.toolsStore.clocks.useClock(message.id);
            //     switch (message.clockType) {
            //         case 'hours':
            //             clock.setHours(message.value);
            //             break;
            //         case 'minutes':
            //             console.log('Clock message received', message, clock);
            //             clock.setMinutes(message.value);
            //             break;
            //         case 'seconds':
            //             clock.setSeconds(message.value);
            //             break;
            //     }
            //     break;
            default:
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
        this._worker = new Worker(new URL('../workers/pyodide.worker', import.meta.url), { type: 'module' });
        return Comlink.wrap<PyWorkerApi>(this._worker);
    }

    @action
    recreatePyWorker() {
        this.pyWorker = null;
        this.runtimeId = Date.now(); // this will automatically stop all running scripts
        return this.initialize(true);
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
