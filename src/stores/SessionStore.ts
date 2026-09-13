import { mdiContentSaveOffOutline, mdiDatabaseSyncOutline, mdiHarddisk } from '@mdi/js';
import api from '@tdev-api/base';
import iStore from '@tdev-stores/iStore';
import { RootStore } from '@tdev-stores/rootStore';
import { action, observable } from 'mobx';

export class SessionStore extends iStore {
    readonly root: RootStore;

    @observable accessor initialized = false;
    @observable accessor isLoggedIn = false;

    @observable accessor currentUserId: string | undefined;
    @observable accessor storageSyncInitialized = false;

    fileSystemDirectoryHandles = observable.map<string, FileSystemDirectoryHandle>([], { deep: false });

    constructor(store: RootStore) {
        super();
        this.root = store;
        this.initialized = true;
    }

    @action
    setCurrentUserId(userId: string | undefined) {
        this.currentUserId = userId;
    }

    @action
    setIsLoggedIn(loggedIn: boolean) {
        this.isLoggedIn = loggedIn;
    }

    get apiMode(): 'indexedDB' | 'memory' | 'api' {
        return api.mode ?? 'api';
    }

    get apiModeIcon(): string {
        if (this.apiMode === 'api') {
            return mdiDatabaseSyncOutline;
        }
        if (this.apiMode === 'indexedDB') {
            return mdiHarddisk; // Use a different icon if needed
        }
        return mdiContentSaveOffOutline; // Use a different icon if needed
    }

    @action
    setFileSystemDirectoryHandle(key: string, handle?: FileSystemDirectoryHandle) {
        if (!handle) {
            return this.fileSystemDirectoryHandles.delete(key);
        }
        this.fileSystemDirectoryHandles.set(key, handle);
    }
}
