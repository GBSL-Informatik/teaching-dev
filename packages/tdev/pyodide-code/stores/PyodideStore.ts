import ExecutionEnvironment from '@docusaurus/ExecutionEnvironment';
import siteConfig from '@generated/docusaurus.config';
import type ViewStore from '@tdev-stores/ViewStores';
import { Message } from '@tdev/pyodide-code/pyodideJsModules';
import * as Comlink from 'comlink';
import { action, computed, observable, observableRef, runInAction } from 'mobx';
import { PY_AWAIT_INPUT, PY_CANCEL_ALL, PY_CANCEL_INPUT, PY_INPUT } from '../config';
import { initializeInputServiceWorker } from '../helpers/inputServiceWorker';
import type PyodideCode from '../models/PyodideCode';
import PyodideRuntime from '../models/PyodideRuntime';
const BASE_URL = siteConfig.baseUrl || '/';
const MAX_IDLE_RUNTIMES = 2;

interface InputRequest {
    requestId: string;
    serviceWorker: ServiceWorker;
}

export default class PyodideStore {
    viewStore: ViewStore;
    readonly executions = observable.map<string, number>();
    private readonly runtimes = new Map<string, PyodideRuntime>();
    private readonly latestExecutions = new Map<string, number>();
    private nextExecutionId = 0;
    private clientId = '';
    private readonly inputRequests = new Map<string, InputRequest>();
    private initialization: Promise<void> | null = null;
    private readonly cancellations = new Map<number, () => void>();
    @observable accessor initializationState: 'idle' | 'loading' | 'ready' | 'error' = 'idle';
    @observable accessor initializationError: string | null = null;
    @observableRef accessor _serviceWorkerRegistration: ServiceWorker | null = null;
    awaitingInputPrompt = observable.map<string, string | null>();
    constructor(viewStore: ViewStore) {
        this.viewStore = viewStore;
        if (ExecutionEnvironment.canUseDOM && 'serviceWorker' in navigator) {
            navigator.serviceWorker.addEventListener('message', this.handleInputMessage);
            window.addEventListener('beforeunload', () => this.cancelAllCodeExecutions());
        }
    }

    @action
    async run(code: PyodideCode) {
        if (code.isExecuting) {
            this.stopExecution(code.id);
        }
        const executionId = ++this.nextExecutionId;
        const source = code.combinedCode;
        const title = code.title;
        const packages = [...code.meta.packages];
        const showPackageLogs = code.meta.showPackageLogs;
        code.clearMessages();
        code.setRuntimeId(executionId);
        this.executions.set(code.id, executionId);
        this.latestExecutions.set(code.id, executionId);
        const stopped = new Promise<void>((resolve) => {
            this.cancellations.set(executionId, resolve);
        });
        try {
            const initialized = await Promise.race([
                this.initialize().then(() => true),
                stopped.then(() => false)
            ]);
            if (!initialized || this.executions.get(code.id) !== executionId) {
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
                worker.run(
                    code.id,
                    source,
                    sendMessage,
                    title,
                    this.clientId,
                    executionId,
                    packages,
                    showPackageLogs
                ),
                runtime.stopped,
                runtime.failed
            ]);
            if (this.executions.get(code.id) === executionId) {
                if (message && !(message.type === 'log' && !message.message)) {
                    this.handleMessage(code, message);
                }
            }
        } catch (error: unknown) {
            runInAction(() => {
                if (this.executions.get(code.id) !== executionId) {
                    return;
                }
                const message = error instanceof Error ? error.message : String(error);
                this.initializationState = 'error';
                this.initializationError = message;
                code.addLogMessage({ type: 'error', message, id: code.id, timeStamp: Date.now() });
                this.cancelCodeExecution(code.id);
                this.runtimes.get(code.id)?.terminate();
                this.runtimes.delete(code.id);
                this.latestExecutions.delete(code.id);
            });
        } finally {
            runInAction(() => {
                this.cancellations.delete(executionId);
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
        const executionId = this.executions.get(id);
        if (executionId !== undefined) {
            this.cancellations.get(executionId)?.();
            this.cancellations.delete(executionId);
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
        return this.initializationState === 'ready';
    }

    @action
    cancelCodeExecution(id: string) {
        const request = this.inputRequests.get(id);
        if (!request) {
            return;
        }
        this.awaitingInputPrompt.delete(id);
        this.inputRequests.delete(id);
        const notified = this.notifyInputWorker(request.serviceWorker, {
            type: PY_CANCEL_INPUT,
            requestId: request.requestId
        });
        if (!notified) {
            this.failInput(id);
        }
    }

    @action
    cancelAllCodeExecutions() {
        const workers = new Set([...this.inputRequests.values()].map((request) => request.serviceWorker));
        if (this._serviceWorkerRegistration) {
            workers.add(this._serviceWorkerRegistration);
        }
        for (const id of [...this.inputRequests.keys()]) {
            this.cancelCodeExecution(id);
        }
        this.awaitingInputPrompt.clear();
        for (const worker of workers) {
            this.notifyInputWorker(worker, { type: PY_CANCEL_ALL });
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
        const notified = this.notifyInputWorker(request.serviceWorker, {
            type: PY_INPUT,
            requestId: request.requestId,
            value
        });
        if (!notified) {
            this.failInput(id);
        }
    }

    private initialize(): Promise<void> {
        if (this.isInitialized && this._serviceWorkerRegistration === navigator.serviceWorker.controller) {
            return Promise.resolve();
        }
        if (this.initialization) {
            return this.initialization;
        }
        runInAction(() => {
            this.initializationState = 'loading';
            this.initializationError = null;
            this._serviceWorkerRegistration = null;
        });
        this.initialization = initializeInputServiceWorker(BASE_URL)
            .then(
                action(({ serviceWorker, clientId }) => {
                    this._serviceWorkerRegistration = serviceWorker;
                    this.clientId = clientId;
                    this.initializationState = 'ready';
                })
            )
            .catch(
                action((error: unknown) => {
                    this.initializationState = 'error';
                    this.initializationError = error instanceof Error ? error.message : String(error);
                    throw error;
                })
            )
            .finally(() => {
                this.initialization = null;
            });
        return this.initialization;
    }

    private handleInputMessage = action((event: MessageEvent) => {
        if (event.data?.type !== PY_AWAIT_INPUT || !(event.source instanceof ServiceWorker)) {
            return;
        }
        if (this.executions.get(event.data.id) !== event.data.executionId) {
            this.notifyInputWorker(event.source, { type: PY_CANCEL_INPUT, requestId: event.data.requestId });
            return;
        }
        this.inputRequests.set(event.data.id, {
            requestId: event.data.requestId,
            serviceWorker: event.source
        });
        this.awaitingInputPrompt.set(event.data.id, event.data.prompt);
    });

    private runtimeFor(id: string) {
        const runtime = this.runtimes.get(id) || new PyodideRuntime();
        this.runtimes.delete(id);
        this.runtimes.set(id, runtime);
        return runtime;
    }

    private notifyInputWorker(
        worker: ServiceWorker,
        message: { type: string; requestId?: string; value?: string }
    ): boolean {
        try {
            worker.postMessage(message);
            return true;
        } catch {
            return false;
        }
    }

    private failInput(id: string) {
        this.runtimes.get(id)?.fail(new Error('Python input connection failed. Run the code again.'));
    }

    private releaseIdleRuntimes() {
        const idleRuntimes = [...this.runtimes].filter(([id]) => !this.executions.has(id));
        for (const [id, runtime] of idleRuntimes.slice(0, -MAX_IDLE_RUNTIMES)) {
            runtime.terminate();
            this.runtimes.delete(id);
        }
    }
}
