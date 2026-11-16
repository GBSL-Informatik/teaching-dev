import { mdiContentSaveOffOutline, mdiDatabaseSyncOutline, mdiHarddisk } from '@mdi/js';
import { apiMode, localDb } from '@tdev-api/base';
import type { DbStatus } from '@tdev-api/OfflineApi/Adapter';
import iStore from '@tdev-stores/iStore';
import { RootStore } from '@tdev-stores/rootStore';
import { action, computed, observable } from 'mobx';

export type OfflineDbProblem = Exclude<DbStatus, 'opening' | 'ready'>;

export class SessionStore extends iStore {
    readonly root: RootStore;

    @observable accessor initialized = false;
    @observable accessor isLoggedIn = false;

    @observable accessor currentUserId: string | undefined;
    @observable accessor storageSyncInitialized = false;
    @observable accessor localDbStatus: DbStatus = 'opening';
    @observable accessor dismissedOfflineDbProblem: OfflineDbProblem | undefined;

    fileSystemDirectoryHandles = observable.map<string, FileSystemDirectoryHandle>([], { deep: false });

    constructor(store: RootStore) {
        super();
        this.root = store;
        this.initialized = true;
        localDb.onStatusChange((status) => this.setLocalDbStatus(status));
    }

    @action
    setLocalDbStatus(status: DbStatus) {
        this.localDbStatus = status;
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
        return apiMode;
    }

    @action
    dismissOfflineDbProblem() {
        this.dismissedOfflineDbProblem = this.offlineDbProblem;
    }

    /** Why the offline api cannot save changes, if it keeps them in the local db. */
    @computed
    get offlineDbProblem(): OfflineDbProblem | undefined {
        if (this.apiMode !== 'indexedDB') {
            return undefined;
        }
        if (this.localDbStatus === 'opening' || this.localDbStatus === 'ready') {
            return undefined;
        }
        return this.localDbStatus;
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
