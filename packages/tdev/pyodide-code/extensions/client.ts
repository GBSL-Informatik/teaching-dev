import extensions from '@tdev-pyodide/client-extensions';
import type { RootStore } from '@tdev-stores/rootStore';
import type ExtensionEventStore from '../stores/ExtensionEventStore';
import type { ClientExtension, ExtensionMessage } from './index';

interface ClientInstance {
    extension: ClientExtension;
    store: unknown;
}

export default class ClientExtensions {
    private readonly instancesByName = new Map<string, ClientInstance>();
    private readonly storesByExtension = new Map<ClientExtension, unknown>();

    constructor(root: RootStore, events: ExtensionEventStore) {
        for (const { name, extension } of extensions) {
            if (this.storesByExtension.has(extension)) {
                throw new Error(`Pyodide client entry is registered more than once: ${name}`);
            }
            const store = extension.createStore({ root, name, events });
            this.instancesByName.set(name, { extension, store });
            this.storesByExtension.set(extension, store);
        }
    }

    useStore<Store>(extension: ClientExtension<Store>): Store {
        if (!this.storesByExtension.has(extension)) {
            throw new Error('This Pyodide extension is not configured. Add its folder to extensions.');
        }
        // The definition that creates the store is also its typed lookup key.
        return this.storesByExtension.get(extension) as Store;
    }

    handleMessage(message: ExtensionMessage) {
        const instance = this.instancesByName.get(message.extension);
        if (!instance) {
            throw new Error(`Unknown Pyodide extension: ${message.extension}`);
        }
        instance.extension.handleMessage(instance.store, {
            editorId: message.id,
            targetId: message.targetId,
            timeStamp: message.timeStamp,
            payload: message.payload
        });
    }
}
