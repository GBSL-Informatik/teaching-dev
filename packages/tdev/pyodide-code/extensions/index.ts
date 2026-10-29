import type { RootStore } from '@tdev-stores/rootStore';
import type { ExecutionEventSource } from '../events';
import type ExtensionEventStore from '../stores/ExtensionEventStore';

export interface ExtensionMessage {
    type: 'extension';
    extension: string;
    id: string;
    targetId: string;
    timeStamp: number;
    payload: unknown;
}

export interface WorkerContext<Payload> {
    editorId: string;
    send: (targetId: string, payload: Payload) => void;
    events: {
        source: (targetId: string) => ExecutionEventSource;
    };
}

export interface ClientContext {
    root: RootStore;
    name: string;
    events: ExtensionEventStore;
}

export interface ExtensionDelivery<Payload> {
    editorId: string;
    targetId: string;
    timeStamp: number;
    payload: Payload;
}

export interface WorkerExtension {
    createModules: (context: WorkerContext<unknown>) => Record<string, object>;
}

export interface ClientExtension<Store = unknown> {
    createStore(context: ClientContext): Store;
    handleMessage(store: Store, message: ExtensionDelivery<unknown>): undefined;
}

export interface ClientExtensionOptions<Payload, Store> {
    createStore: (context: ClientContext) => Store;
    handleMessage: (store: Store, message: ExtensionDelivery<Payload>) => undefined;
}

export interface RegisteredExtension<Extension> {
    name: string;
    extension: Extension;
}

export const defineWorkerExtension = <Payload>(
    createModules: (context: WorkerContext<Payload>) => Record<string, object>
): WorkerExtension => ({
    createModules: (context) =>
        createModules({
            editorId: context.editorId,
            events: context.events,
            send: (targetId, payload) => context.send(targetId, payload)
        })
});

export function defineClientExtension<Payload>(
    handleMessage: (context: ClientContext, message: ExtensionDelivery<Payload>) => undefined
): ClientExtension<ClientContext>;
export function defineClientExtension<Payload, Store>(
    options: ClientExtensionOptions<Payload, Store>
): ClientExtension<Store>;
export function defineClientExtension<Payload, Store>(
    options:
        | ClientExtensionOptions<Payload, Store>
        | ((context: ClientContext, message: ExtensionDelivery<Payload>) => undefined)
): ClientExtension<Store> | ClientExtension<ClientContext> {
    if (typeof options === 'function') {
        return defineClientExtension<Payload, ClientContext>({
            createStore: (context) => context,
            handleMessage: options
        });
    }
    return {
        createStore: options.createStore,
        // The configured worker and client entries share their payload contract.
        handleMessage: (store: Store, message: ExtensionDelivery<unknown>) =>
            options.handleMessage(store, message as ExtensionDelivery<Payload>)
    };
}
