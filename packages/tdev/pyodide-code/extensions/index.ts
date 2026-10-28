import type { RootStore } from '@tdev-stores/rootStore';

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
}

export interface ClientContext {
    root: RootStore;
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

export interface ClientExtension {
    handleMessage: (context: ClientContext, message: ExtensionDelivery<unknown>) => undefined;
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
            send: (targetId, payload) => context.send(targetId, payload)
        })
});

export const defineClientExtension = <Payload>(
    handleMessage: (context: ClientContext, message: ExtensionDelivery<Payload>) => undefined
): ClientExtension => ({
    // The configured worker and client entries share their payload contract.
    handleMessage: (context, message) => handleMessage(context, message as ExtensionDelivery<Payload>)
});
