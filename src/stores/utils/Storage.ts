import { User } from '@tdev-api/user';
import siteConfig from '@generated/docusaurus.config';
import _ from 'es-toolkit/compat';
import MemoryStorage from './MemoryStorage';
import ExecutionEnvironment from '@docusaurus/ExecutionEnvironment';

export type PersistedData = {
    user?: User;
};

export const StorageKey = Object.freeze({
    SessionStore: _.upperFirst(_.camelCase(`SessionStore${siteConfig.projectName || ''}`)),
    QrScannerDeviceId: 'QrScannerDeviceId',
    CmsViewMode: 'CmsViewMode'
});

/**
 * @see https://github.com/outline/outline/blob/main/shared/utils/Storage.ts
 * Storage is a wrapper class for localStorage that allow safe usage when
 * localStorage is not available.
 */
class Storage {
    interface: typeof localStorage | MemoryStorage;

    public constructor() {
        try {
            localStorage.setItem('test', 'test');
            localStorage.removeItem('test');
            this.interface = localStorage;
        } catch (_err) {
            if (ExecutionEnvironment.canUseDOM) {
                console.log('localStorage not available, falling back to memory storage');
            }
            this.interface = new MemoryStorage();
        }
    }

    /**
     * Set a value in storage. For efficiency, this method will remove the
     * value if it is undefined.
     *
     * @param key The key to set under.
     * @param value The value to set
     */
    public set<T>(key: keyof typeof StorageKey, value: T, storeAsJson = true) {
        this.setUnsafe(StorageKey[key], value, storeAsJson);
    }

    public setUnsafe<T>(key: string, value: T, storeAsJson = true) {
        try {
            if (value === undefined) {
                this.removeUnsafe(key);
            } else {
                this.interface.setItem(key, storeAsJson ? JSON.stringify(value) : (value as any));
            }
        } catch (_err) {
            // Ignore errors
        }
    }

    /**
     * Get a value from storage.
     *
     * @param key The key to get.
     * @param fallback The fallback value if the key doesn't exist.
     * @returns The value or undefined if it doesn't exist.
     */
    public get<T>(key: keyof typeof StorageKey, fallback?: T, restoreFromJson = true): T | undefined {
        try {
            return this.getUnsafe(StorageKey[key], fallback, restoreFromJson);
        } catch (_err) {
            // Ignore errors
        }

        return fallback;
    }

    public getUnsafe<T>(key: string, fallback?: T, restoreFromJson = true): T | undefined {
        try {
            const value = this.interface.getItem(key);
            if (restoreFromJson && typeof value === 'string') {
                return JSON.parse(value);
            } else {
                return (value as T) ?? fallback;
            }
        } catch (_err) {
            // ignore errors
        }
        return fallback;
    }

    /**
     * Remove a value from storage.
     *
     * @param key The key to remove.
     */
    public remove(key: keyof typeof StorageKey) {
        try {
            this.interface.removeItem(StorageKey[key]);
        } catch (_err) {
            // Ignore errors
        }
    }

    public removeUnsafe(key: string) {
        try {
            this.interface.removeItem(key);
        } catch (_err) {
            // Ignore errors
        }
    }
}

export default new Storage();
