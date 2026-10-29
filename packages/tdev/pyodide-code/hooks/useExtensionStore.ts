import { useStore } from '@tdev-hooks/useStore';
import type { ClientExtension } from '../extensions';

export const useExtensionStore = <Store>(extension: ClientExtension<Store>): Store => {
    const viewStore = useStore('viewStore');
    const pyodideStore = viewStore.useStore('pyodideStore');
    if (!pyodideStore) {
        throw new Error('Register the Pyodide package before using its extension components.');
    }
    return pyodideStore.extensions.useStore(extension);
};
