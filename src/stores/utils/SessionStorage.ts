import siteConfig from '@generated/docusaurus.config';
import _ from 'es-toolkit/compat';
import MemoryStorage from './MemoryStorage';
import ExecutionEnvironment from '@docusaurus/ExecutionEnvironment';

export const StorageKey = Object.freeze({
    GithubToken: _.upperFirst(_.camelCase(`GithubToken${siteConfig.projectName || ''}`))
});

/**
 * @see https://github.com/outline/outline/blob/main/shared/utils/Storage.ts
 * Storage is a wrapper class for sessionStorage that allow safe usage when
 * sessionStorage is not available.
 */
class SessionStorage {
    interface: typeof sessionStorage | MemoryStorage;

    public constructor() {
        try {
            sessionStorage.setItem('test', 'test');
            sessionStorage.removeItem('test');
            this.interface = sessionStorage;
        } catch (_err) {
            if (ExecutionEnvironment.canUseDOM) {
                console.log('sessionStorage not available, falling back to memory storage');
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
    public set<T>(key: keyof typeof StorageKey, value: T) {
        try {
            if (value === undefined) {
                this.remove(key);
            } else {
                this.interface.setItem(StorageKey[key], JSON.stringify(value));
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
    public get<T>(key: keyof typeof StorageKey, fallback?: T): T | undefined {
        try {
            const value = this.interface.getItem(StorageKey[key]);
            if (typeof value === 'string') {
                return JSON.parse(value);
            }
        } catch (_err) {
            // Ignore errors
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
}

export default new SessionStorage();
