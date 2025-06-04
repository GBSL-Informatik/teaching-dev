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
import { AdminStore } from '@tdev-stores/AdminStore';
import { CmsStore } from '@tdev-stores/CmsStore';
import SiteStore from '@tdev-stores/SiteStore';
import { SignupTokenStore } from './SignupTokenStore';

export class RootStore {
    documentRootStore: DocumentRootStore;
    userStore: UserStore;
    signupTokenStore: SignupTokenStore;
    sessionStore: SessionStore;
    socketStore: SocketDataStore;
    studentGroupStore: StudentGroupStore;
    permissionStore: PermissionStore;
    documentStore: DocumentStore;
    pageStore: PageStore;
    adminStore: AdminStore;
    cmsStore: CmsStore;
    siteStore: SiteStore;

    // @observable accessor initialized = false;
    constructor() {
        this.documentRootStore = new DocumentRootStore(this);
        this.userStore = new UserStore(this);
        this.signupTokenStore = new SignupTokenStore(this);
        this.sessionStore = new SessionStore(this);
        this.socketStore = new SocketDataStore(this);
        this.studentGroupStore = new StudentGroupStore(this);
        this.permissionStore = new PermissionStore(this);
        this.documentStore = new DocumentStore(this);
        this.pageStore = new PageStore(this);
        this.adminStore = new AdminStore(this);
        this.cmsStore = new CmsStore(this);
        this.siteStore = new SiteStore(this);

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
                this.signupTokenStore.load();
                this.studentGroupStore.load();
                this.cmsStore.initialize();
                if (user.hasElevatedAccess) {
                    this.adminStore.load();
                }
            }
        });
    }

    @action
    cleanup() {
        /**
         * could be probably ignored since the page gets reloaded on logout?
         */
        console.log('cleanup data stores');
        this.userStore.cleanup();
        this.socketStore.cleanup();
        this.studentGroupStore.cleanup();
    }
}

export const rootStore = Object.freeze(new RootStore());
export const storesContext = React.createContext(rootStore);
export const StoresProvider = storesContext.Provider;
