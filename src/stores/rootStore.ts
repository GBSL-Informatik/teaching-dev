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
import { AuthStore } from './AuthStore';
import ComponentStore from './ComponentStore';
import ViewStore from './ViewStores';

export class RootStore {
    documentRootStore: DocumentRootStore;
    userStore: UserStore;
    sessionStore: SessionStore;
    socketStore: SocketDataStore;
    studentGroupStore: StudentGroupStore;
    permissionStore: PermissionStore;
    documentStore: DocumentStore;
    pageStore: PageStore;
    adminStore: AdminStore;
    cmsStore: CmsStore;
    siteStore: SiteStore;
    viewStore: ViewStore;
    authStore: AuthStore;
    componentStore: ComponentStore;

    // @observable accessor initialized = false;
    constructor() {
        this.viewStore = new ViewStore(this);
        this.documentRootStore = new DocumentRootStore(this);
        this.sessionStore = new SessionStore(this);
        this.userStore = new UserStore(this);
        this.socketStore = new SocketDataStore(this);
        this.studentGroupStore = new StudentGroupStore(this);
        this.permissionStore = new PermissionStore(this);
        this.documentStore = new DocumentStore(this);
        this.pageStore = new PageStore(this);
        this.adminStore = new AdminStore(this);
        this.cmsStore = new CmsStore(this);
        this.siteStore = new SiteStore(this);
        this.authStore = new AuthStore(this);
        this.componentStore = new ComponentStore(this);
    }

    @action
    load(userId: string) {
        this.sessionStore.setCurrentUserId(userId);
        this.sessionStore.setIsLoggedIn(!!userId);
        this.userStore.loadCurrent().then((user) => {
            if (user) {
                this.socketStore.reconnect();
                this.documentRootStore.loadQueued();
                /**
                 * load stores
                 */
                this.userStore.load();
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
        this.sessionStore.setIsLoggedIn(false);
        this.userStore.cleanup();
        this.socketStore.cleanup();
        this.studentGroupStore.cleanup();
    }
}

export const rootStore = Object.freeze(new RootStore());
export const storesContext = React.createContext(rootStore);
export const StoresProvider = storesContext.Provider;
