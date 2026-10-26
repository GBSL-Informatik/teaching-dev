import ExecutionEnvironment from '@docusaurus/ExecutionEnvironment';
import siteConfig from '@generated/docusaurus.config';
import SessionStorage from '@tdev-stores/utils/SessionStorage';
import type ViewStore from '@tdev-stores/ViewStores';
import { Message } from '@tdev/pyodide-code/pyodideJsModules';
import * as Comlink from 'comlink';
import { action, computed, observable, observableRef, runInAction } from 'mobx';
import { PY_AWAIT_INPUT, PY_CANCEL_ALL, PY_CANCEL_INPUT, PY_INPUT } from '../config';
import type PyodideCode from '../models/PyodideCode';
import PyodideRuntime from '../models/PyodideRuntime';
const BASE_URL = siteConfig.baseUrl || '/';
const MAX_IDLE_RUNTIMES = 2;

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
    readonly executions = observable.map<string, number>();
    private readonly runtimes = new Map<string, PyodideRuntime>();
    private readonly latestExecutions = new Map<string, number>();
    private nextExecutionId = 0;
    private readonly initialization: Promise<void>;
    @observableRef accessor _serviceWorkerRegistration: ServiceWorker | null = null;
    awaitingInputPrompt = observable.map<string, string | null>();
    constructor(viewStore: ViewStore) {
        this.viewStore = viewStore;
        this.initialization = this.registerServiceWorker();
    }

    @action
    async run(code: PyodideCode) {
        if (code.isExecuting) {
            this.stopExecution(code.id);
        }
        const executionId = ++this.nextExecutionId;
        const source = code.combinedCode;
        const title = code.title;
        code.clearMessages();
        code.setRuntimeId(executionId);
        this.executions.set(code.id, executionId);
        this.latestExecutions.set(code.id, executionId);
        try {
            await this.initialization;
            if (this.executions.get(code.id) !== executionId) {
                return;
            }
            const runtime = this.runtimeFor(code.id);
            const worker = await Promise.race([runtime.api, runtime.stopped.then(() => null)]);
            if (!worker || this.executions.get(code.id) !== executionId) {
                return;
            }
            const sendMessage = Comlink.proxy(
                action((message: Message) => {
                    if (this.latestExecutions.get(code.id) === executionId) {
                        this.handleMessage(code, message);
                    }
                })
            );
            const message = await Promise.race([
                worker.run(code.id, source, sendMessage, title),
                runtime.stopped
            ]);
            if (this.executions.get(code.id) === executionId) {
                if (message && !(message.type === 'log' && message.message === undefined)) {
                    this.handleMessage(code, message);
                }
            }
        } finally {
            runInAction(() => {
                if (this.executions.get(code.id) === executionId) {
                    this.executions.delete(code.id);
                    code.setRuntimeId(null);
                }
                this.releaseIdleRuntimes();
            });
        }
    }

    @action
    stopExecution(id: string) {
        if (this.awaitingInputPrompt.has(id)) {
            this.cancelCodeExecution(id);
        }
        this.executions.delete(id);
        this.latestExecutions.delete(id);
        this.runtimes.get(id)?.terminate();
        this.runtimes.delete(id);
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
        return this._serviceWorkerRegistration !== null;
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

    private runtimeFor(id: string) {
        const runtime = this.runtimes.get(id) || new PyodideRuntime();
        this.runtimes.delete(id);
        this.runtimes.set(id, runtime);
        return runtime;
    }

    private releaseIdleRuntimes() {
        const idleRuntimes = [...this.runtimes].filter(([id]) => !this.executions.has(id));
        for (const [id, runtime] of idleRuntimes.slice(0, -MAX_IDLE_RUNTIMES)) {
            runtime.terminate();
            this.runtimes.delete(id);
        }
    }
}
