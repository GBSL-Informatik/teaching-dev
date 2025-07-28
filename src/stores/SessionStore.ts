import { AccountInfo, IPublicClientApplication } from '@azure/msal-browser';
import { action, computed, observable } from 'mobx';
import { RootStore } from '@tdev-stores/rootStore';
import { logout } from '@tdev-api/user';
import Storage, { PersistedData, StorageKey } from '@tdev-stores/utils/Storage';
import iStore from '@tdev-stores/iStore';
import api from '@tdev-api/base';
import { mdiContentSaveOffOutline, mdiDatabaseSyncOutline, mdiHarddisk } from '@mdi/js';

class State {
    @observable.ref accessor account: AccountInfo | undefined | null = undefined;

    @observable.ref accessor _msalInstance: IPublicClientApplication | undefined = undefined;

    constructor() {}
}

export class SessionStore extends iStore {
    readonly root: RootStore;

    @observable.ref private accessor stateRef: State = new State();

    @observable accessor authMethod: 'apiKey' | 'msal';

    @observable accessor currentUserId: string | undefined;

    @observable accessor initialized = false;

    @observable accessor storageSyncInitialized = false;

    fileSystemDirectoryHandles = observable.map<string, FileSystemDirectoryHandle>([], { deep: false });

    constructor(store: RootStore) {
        super();
        this.root = store;
        const data = Storage.get('SessionStore', {} as PersistedData);
        if (data?.user) {
            this.authMethod = 'apiKey';
            this.rehydrate(data);
        } else {
            this.authMethod = 'msal';
        }
        this.initialized = true;
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
    rehydrate(data: PersistedData) {
        this.authMethod = !!data?.user ? 'apiKey' : 'msal';
        if (!data.user || this.currentUserId) {
            return;
        }
        this.currentUserId = data.user?.id;
    }

    @action
    setFileSystemDirectoryHandle(key: string, handle?: FileSystemDirectoryHandle) {
        if (!handle) {
            return this.fileSystemDirectoryHandles.delete(key);
        }
        this.fileSystemDirectoryHandles.set(key, handle);
    }

    @action
    logout() {
        const sig = new AbortController();
        logout(sig.signal)
            .catch((err) => {
                console.error('Failed to logout', err);
            })
            .finally(() => {
                Storage.remove('SessionStore');
                localStorage.clear();
                window.location.reload();
            });
    }

    @action
    setMsalStrategy() {
        Storage.remove('SessionStore');
        this.authMethod = 'msal';
    }

    @computed
    get account(): AccountInfo | null | undefined {
        return this.stateRef.account;
    }

    @computed
    get userId() {
        return this.currentUserId || this.account?.localAccountId;
    }

    @action
    setAccount(account?: AccountInfo | null) {
        this.stateRef.account = account;
    }

    @computed
    get isLoggedIn(): boolean {
        return this.authMethod === 'apiKey' ? !!this.currentUserId : !!this.stateRef.account;
    }

    @action
    setupStorageSync() {
        if (this.storageSyncInitialized) {
            return;
        }
        window.addEventListener('storage', (event) => {
            if (event.key === StorageKey['SessionStore'] && event.newValue) {
                const newData: PersistedData | null = JSON.parse(event.newValue);

                // data may be null if key is deleted in localStorage
                if (!newData) {
                    return;
                }

                // If we're not signed in then hydrate from the received data, otherwise if
                // we are signed in and the received data contains no user then sign out
                if (this.isLoggedIn) {
                    if (newData.user === null) {
                        void this.logout();
                    }
                } else {
                    this.rehydrate(newData);
                    this.root.userStore.rehydrate(newData);
                }
            }
        });
        this.storageSyncInitialized = true;
    }
}
