import React from 'react';
import { DocumentRootStore } from '@tdev-stores/DocumentRootStore';
import { UserStore } from '@tdev-stores/UserStore';
import { SessionStore } from '@tdev-stores/SessionStore';
import { SocketDataStore } from '@tdev-stores/SocketDataStore';
import { action } from 'mobx';
import { StudentGroupStore } from '@tdev-stores/StudentGroupStore';
import PermissionStore from '@tdev-stores/PermissionStore';
import DocumentStore from '@tdev-stores/DocumentStore';
import { PageStore } from '@tdev-stores/PageStore';
import { UserMessageStore } from './UserMessageStore';

export class RootStore {
    documentRootStore: DocumentRootStore;
    userStore: UserStore;
    sessionStore: SessionStore;
    socketStore: SocketDataStore;
    studentGroupStore: StudentGroupStore;
    permissionStore: PermissionStore;
    documentStore: DocumentStore;
    pageStore: PageStore;
    userMessageStore: UserMessageStore;

    // @observable accessor initialized = false;
    constructor() {
        this.documentRootStore = new DocumentRootStore(this);
        this.sessionStore = new SessionStore(this);
        this.userStore = new UserStore(this);
        this.socketStore = new SocketDataStore(this);
        this.studentGroupStore = new StudentGroupStore(this);
        this.permissionStore = new PermissionStore(this);
        this.documentStore = new DocumentStore(this);
        this.pageStore = new PageStore(this);
        this.userMessageStore = new UserMessageStore(this);

        if (this.sessionStore.isLoggedIn) {
            this.load();
        }
    }

    @action
    load() {
        this.userStore.loadCurrent().then((user) => {
            if (user) {
                this.socketStore.reconnect();
                /**
                 * load stores
                 */
                this.userStore.load();
                this.studentGroupStore.load();
            }
        });
    }

    @action
    cleanup() {
        /**
         * could be probably ignored since the page gets reloaded on logout?
         */
        this.userStore.cleanup();
        this.socketStore.cleanup();
        this.studentGroupStore.cleanup();
        this.userMessageStore.cleanup();
    }
}

export const rootStore = Object.freeze(new RootStore());
export const storesContext = React.createContext(rootStore);
export const StoresProvider = storesContext.Provider;
