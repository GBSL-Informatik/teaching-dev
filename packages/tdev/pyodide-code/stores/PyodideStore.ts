import ExecutionEnvironment from '@docusaurus/ExecutionEnvironment';
import siteConfig from '@generated/docusaurus.config';
import SessionStorage from '@tdev-stores/utils/SessionStorage';
import type ViewStore from '@tdev-stores/ViewStores';
import { Message } from '@tdev/pyodide-code/pyodideJsModules';
import * as Comlink from 'comlink';
import { action, computed, observable, observableRef, runInAction } from 'mobx';
import { PY_AWAIT_INPUT, PY_CANCEL_ALL, PY_CANCEL_INPUT, PY_CLIENT_ID, PY_INPUT } from '../config';
import type PyodideCode from '../models/PyodideCode';
import PyodideRuntime from '../models/PyodideRuntime';
const BASE_URL = siteConfig.baseUrl || '/';
// Bound unused heaps while keeping a recent pair of editors warm.
const MAX_IDLE_RUNTIMES = 2;

interface InputRequest {
    requestId: string;
    serviceWorker: ServiceWorker;
}

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
    // Delayed callbacks may arrive after completion; stop/restart invalidates them.
    private readonly latestExecutions = new Map<string, number>();
    private nextExecutionId = 0;
    private clientId = '';
    private readonly inputRequests = new Map<string, InputRequest>();
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
                worker.run(code.id, source, sendMessage, title, this.clientId, executionId),
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
        const request = this.inputRequests.get(id);
        if (!request) {
            return;
        }
        this.awaitingInputPrompt.delete(id);
        this.inputRequests.delete(id);
        request.serviceWorker.postMessage({
            type: PY_CANCEL_INPUT,
            requestId: request.requestId
        });
    }

    @action
    cancelAllCodeExecutions() {
        if (!this._serviceWorkerRegistration) {
            console.error('No service worker registration');
            return;
        }
        this.awaitingInputPrompt.clear();
        const workers = new Set([...this.inputRequests.values()].map((request) => request.serviceWorker));
        workers.add(this._serviceWorkerRegistration);
        this.inputRequests.clear();
        for (const worker of workers) {
            worker.postMessage({ type: PY_CANCEL_ALL });
        }
    }

    @action
    sendInputResponse(id: string, value: string) {
        const request = this.inputRequests.get(id);
        if (!request) {
            return;
        }
        this.awaitingInputPrompt.delete(id);
        this.inputRequests.delete(id);
        request.serviceWorker.postMessage({
            type: PY_INPUT,
            requestId: request.requestId,
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
            this.clientId = await this.requestClientId(registration);

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
                        if (!(event.source instanceof ServiceWorker)) {
                            return;
                        }
                        if (this.executions.get(event.data.id) !== event.data.executionId) {
                            event.source.postMessage({
                                type: PY_CANCEL_INPUT,
                                requestId: event.data.requestId
                            });
                            return;
                        }
                        const serviceWorker = event.source;
                        runInAction(() => {
                            this.inputRequests.set(event.data.id, {
                                requestId: event.data.requestId,
                                serviceWorker
                            });
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

    private async requestClientId(registration: ServiceWorkerRegistration): Promise<string> {
        // Retry against the current worker while a protocol update activates.
        for (let attempt = 0; attempt < 3; attempt++) {
            const currentRegistration = await navigator.serviceWorker.getRegistration(BASE_URL);
            const serviceWorker = currentRegistration?.active || registration.active;
            if (!serviceWorker) {
                break;
            }
            const clientId = await new Promise<string | null>((resolve) => {
                const channel = new MessageChannel();
                const finish = (value: string | null) => {
                    clearTimeout(timeout);
                    channel.port1.close();
                    resolve(value);
                };
                const timeout = setTimeout(() => finish(null), 2000);
                channel.port1.onmessage = (event) => finish(event.data.clientId);
                serviceWorker.postMessage({ type: PY_CLIENT_ID }, [channel.port2]);
            });
            if (clientId) {
                return clientId;
            }
        }
        throw new Error('Python input service worker did not respond. Reload to finish updating it.');
    }

    private releaseIdleRuntimes() {
        const idleRuntimes = [...this.runtimes].filter(([id]) => !this.executions.has(id));
        for (const [id, runtime] of idleRuntimes.slice(0, -MAX_IDLE_RUNTIMES)) {
            runtime.terminate();
            this.runtimes.delete(id);
        }
    }
}
