import ExecutionEnvironment from '@docusaurus/ExecutionEnvironment';
import siteConfig from '@generated/docusaurus.config';
import type ViewStore from '@tdev-stores/ViewStores';
import * as Comlink from 'comlink';
import { action, computed, observable, observableRef, runInAction } from 'mobx';
import { PY_AWAIT_INPUT, PY_CANCEL_ALL, PY_CANCEL_INPUT, PY_INPUT } from '../config';
import type { EventDeliveryResult, ExecutionEvent } from '../events';
import type { ExtensionMessage } from '../extensions';
import ClientExtensions from '../extensions/client';
import { initializeInputServiceWorker } from '../helpers/inputServiceWorker';
import type { Message } from '../messages';
import type PyodideCode from '../models/PyodideCode';
import PyodideRuntime from '../models/PyodideRuntime';
import ExtensionEventStore from './ExtensionEventStore';

const BASE_URL = siteConfig.baseUrl || '/';
// Bound unused heaps while keeping two recent runtimes warm.
const MAX_IDLE_RUNTIMES = 2;

interface InputRequest {
    requestId: string;
    serviceWorker: ServiceWorker;
}

export default class PyodideStore {
    viewStore: ViewStore;
    readonly executions = observable.map<string, number>();
    readonly events = new ExtensionEventStore(this);
    readonly extensions: ClientExtensions;
    private readonly retainedRuntimes = new Set<string>();
    private readonly runtimes = new Map<string, PyodideRuntime>();
    private readonly idleRuntimes: PyodideRuntime[] = [];
    // Delayed callbacks may arrive after completion; stop/restart invalidates them.
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
        this.extensions = new ClientExtensions(viewStore.root, this.events);
        if (ExecutionEnvironment.canUseDOM && 'serviceWorker' in navigator) {
            navigator.serviceWorker.addEventListener('message', this.handleInputMessage);
            window.addEventListener('beforeunload', () => this.cancelAllCodeExecutions());
        }
    }

    @action
    async run(code: PyodideCode) {
        if (this.executions.has(code.id)) {
            return;
        }
        const executionId = ++this.nextExecutionId;
        const source = code.combinedCode;
        const title = code.title;
        const packages = [...code.meta.packages];
        code.clearMessages();
        code.setRuntimeId(executionId);
        this.executions.set(code.id, executionId);
        this.latestExecutions.set(code.id, executionId);
        this.retainedRuntimes.delete(code.id);
        const stopped = new Promise<void>((resolve) => {
            this.cancellations.set(executionId, resolve);
        });
        let runtime: PyodideRuntime | undefined;
        try {
            const initialized = await Promise.race([
                this.initialize().then(() => true),
                stopped.then(() => false)
            ]);
            if (!initialized || this.latestExecutions.get(code.id) !== executionId) {
                return;
            }
            runtime = this.runtimeFor(code.id);
            const worker = await Promise.race([
                runtime.api,
                runtime.stopped.then(() => null),
                stopped.then(() => null)
            ]);
            if (!worker || this.latestExecutions.get(code.id) !== executionId) {
                return;
            }
            if (!runtime.isUsable) {
                throw new Error('Python worker failed. Run the code again to retry.');
            }
            const sendMessage = Comlink.proxy(
                action((message: Message) => {
                    if (this.latestExecutions.get(code.id) === executionId) {
                        this.handleMessage(code, message);
                    }
                })
            );
            const result = await Promise.race([
                worker.run(code.id, source, sendMessage, title, this.clientId, executionId, packages),
                runtime.stopped,
                runtime.failed
            ]);
            runInAction(() => {
                if (result && this.latestExecutions.get(code.id) === executionId) {
                    const { message } = result;
                    if (!result.reusable) {
                        this.retainedRuntimes.add(code.id);
                    }
                    if (!(message.type === 'log' && !message.message)) {
                        this.handleMessage(code, message);
                    }
                }
            });
        } catch (error: unknown) {
            runInAction(() => {
                if (this.latestExecutions.get(code.id) !== executionId) {
                    return;
                }
                const message = error instanceof Error ? error.message : String(error);
                code.addLogMessage({ type: 'error', message, id: code.id, timeStamp: Date.now() });
                this.cancelCodeExecution(code.id);
                this.retainedRuntimes.add(code.id);
                this.latestExecutions.delete(code.id);
            });
        } finally {
            runInAction(() => {
                this.events.close(code.id, executionId);
                this.cancellations.delete(executionId);
                if (this.executions.get(code.id) === executionId) {
                    this.executions.delete(code.id);
                    code.setRuntimeId(null);
                }
                if (runtime) {
                    this.releaseRuntime(code.id, runtime);
                }
            });
        }
    }

    @action
    stopExecution(id: string) {
        const executionId = this.executions.get(id);
        if (executionId === undefined) {
            return;
        }
        this.latestExecutions.delete(id);
        this.events.close(id, executionId);
        if (this.awaitingInputPrompt.has(id)) {
            this.cancelCodeExecution(id);
        }
        this.cancellations.get(executionId)?.();
        this.cancellations.delete(executionId);
        this.executions.delete(id);
        this.runtimes.get(id)?.terminate();
        this.runtimes.set(id, new PyodideRuntime());
        this.retainedRuntimes.delete(id);
    }

    @action
    handleMessage(code: PyodideCode, message: Message) {
        switch (message.type) {
            case 'execution-started':
                code.markRunning(message.executionId);
                break;
            case 'event-subscriptions':
                if (message.operation === 'close') {
                    this.events.close(code.id, message.executionId);
                } else {
                    this.events.open(code, message.executionId, message.sources);
                }
                break;
            case 'extension':
                this.handleExtensionMessage(code, message);
                break;
            case 'clear':
                code.clearMessages();
                break;
            case 'log':
                code.addLogMessage(message);
                break;
            case 'error':
                this.retainedRuntimes.add(code.id);
                code.addLogMessage(message);
                break;
        }
    }

    async deliverEvent(event: ExecutionEvent): Promise<EventDeliveryResult> {
        if (this.executions.get(event.editorId) !== event.executionId) {
            return 'inactive';
        }
        const runtime = this.runtimes.get(event.editorId);
        if (!runtime) {
            return 'inactive';
        }
        return runtime.deliverEvent(event);
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

    private handleExtensionMessage(code: PyodideCode, message: ExtensionMessage) {
        const executionId = this.executions.get(code.id);
        try {
            this.extensions.handleMessage(message);
        } catch (error: unknown) {
            if (executionId === undefined || this.executions.get(code.id) !== executionId) {
                return;
            }
            code.addLogMessage({
                type: 'error',
                message: error instanceof Error ? error.message : String(error),
                id: code.id,
                timeStamp: Date.now()
            });
            this.stopExecution(code.id);
            code.setRuntimeId(null);
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
        const { id, executionId } = event.data;
        if (this.executions.get(id) !== executionId || this.latestExecutions.get(id) !== executionId) {
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
        const retainedRuntime = this.runtimes.get(id);
        if (retainedRuntime?.isUsable) {
            return retainedRuntime;
        }
        retainedRuntime?.terminate();
        let runtime = this.idleRuntimes.pop();
        while (runtime && !runtime.isUsable) {
            runtime.terminate();
            runtime = this.idleRuntimes.pop();
        }
        runtime ||= new PyodideRuntime();
        this.runtimes.set(id, runtime);
        return runtime;
    }

    private releaseRuntime(id: string, runtime: PyodideRuntime) {
        if (this.runtimes.get(id) !== runtime) {
            return;
        }
        if (this.retainedRuntimes.has(id) || !runtime.isUsable) {
            return;
        }
        this.runtimes.delete(id);
        this.idleRuntimes.push(runtime);
        while (this.idleRuntimes.length > MAX_IDLE_RUNTIMES) {
            this.idleRuntimes.shift()?.terminate();
        }
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
        this.runtimes
            .get(id)
            ?.fail(new Error('Python input connection failed. Run the code again to retry.'));
    }
}
