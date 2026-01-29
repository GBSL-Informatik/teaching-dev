import { action, computed, observable } from 'mobx';
import { DocumentRootBase as DocumentRootProps } from '@tdev-api/documentRoot';
import { DocumentRootStore } from '@tdev-stores/DocumentRootStore';
import { Access, DocumentType, TypeDataMapping, TypeModelMapping } from '@tdev-api/document';
import { highestAccess, NoneAccess, ROAccess, RWAccess } from './helpers/accessPolicy';
import { isDummyId } from '@tdev-hooks/useDummyId';

export abstract class TypeMeta<T extends DocumentType> {
    readonly pagePosition: number;
    type: T;
    access?: Access;
    constructor(type: T, access?: Access, pagePosition?: number) {
        this.type = type;
        this.access = access;
        this.pagePosition = pagePosition || 0;
    }
    abstract get defaultData(): TypeDataMapping[T];
}

class DocumentRoot<T extends DocumentType> {
    readonly store: DocumentRootStore;
    readonly id: string;
    readonly meta: TypeMeta<T>;
    /**
     * dummy document roots are used to create new documents, which should not be
     * persisted to the api.
     * This is useful to support interactive behavior even for not logged in users or
     * in offline mode.
     */
    readonly isDummy: boolean;
    readonly initializedAt: number;

    @observable accessor isLoaded: boolean = false;
    @observable accessor _access: Access;
    @observable accessor _sharedAccess: Access;

    constructor(props: DocumentRootProps, meta: TypeMeta<T>, store: DocumentRootStore, isDummy?: boolean) {
        this.store = store;
        this.meta = meta;
        this.id = props.id;
        this._access = props.access;
        this._sharedAccess = props.sharedAccess;
        this.isDummy = !!isDummy;
        this.initializedAt = Date.now();
        if (!isDummy) {
            this.setLoaded();
        }
    }

    @computed
    get isLoadable() {
        return !isDummyId(this.id) && this.store.root.sessionStore.isLoggedIn;
    }

    @action
    setLoaded() {
        this.isLoaded = true;
    }

    get type() {
        return this.meta.type;
    }

    get access() {
        return highestAccess(new Set([this._access]), this.meta.access);
    }

    get rootAccess() {
        return this._access;
    }

    @action
    setRootAccess(access: Access) {
        if (this._access === access) {
            return;
        }
        this._access = access;
    }

    get sharedAccess() {
        return this._sharedAccess;
    }

    @action
    setSharedAccess(access: Access) {
        if (this._sharedAccess === access) {
            return;
        }
        this._sharedAccess = access;
    }

    get loadStatus() {
        return this.store.apiStateFor(`load-${this.id}`);
    }

    get userPermissions() {
        return this.store.root.permissionStore.userPermissionsByDocumentRoot(this.id);
    }

    get groupPermissions() {
        return this.store.root.permissionStore.groupPermissionsByDocumentRoot(this.id);
    }

    @computed
    get pages() {
        return this.store.root.pageStore.pages.filter((p) => p.documentRootConfigs.has(this.id));
    }

    /**
     * Map of page paths to their position in this document root
     */
    @computed
    get pagePositions() {
        return new Map<string, number>(
            this.pages.map((p) => [p.path, p.documentRootConfigs.get(this.id)!.position])
        );
    }

    @computed
    get permissions() {
        return [...this.store.currentUsersPermissions(this.id)];
    }

    @computed
    get permission() {
        return highestAccess(new Set([...this.permissions.map((p) => p.access), this.access]));
    }

    permissionsForUser(userId: string) {
        return [...this.store.usersPermissions(this.id, userId)];
    }

    permissionForUser(userId: string) {
        return highestAccess(new Set([...this.permissionsForUser(userId).map((p) => p.access), this.access]));
    }

    @computed
    get documents() {
        if (!this.viewedUserId && !this.isDummy) {
            return [];
        }
        const docs = this.store.root.documentStore.findByDocumentRoot(this.id).filter((d) => {
            return (
                this.isDummy ||
                d.authorId === this.viewedUserId ||
                !NoneAccess.has(highestAccess(new Set([this.permission]), this.sharedAccess))
            );
        });
        return docs;
    }

    /**
     * All documents which are related to this document root.
     * This method should be used only for admin users.
     */
    get allDocuments() {
        if (!this.store.root.userStore.current?.hasElevatedAccess) {
            return this.documents;
        }
        return this.store.root.documentStore.findByDocumentRoot(this.id);
    }

    /**
     * TODO: replace this placeholder to the currently viewed user
     * @default: should return the current viewed user id
     *      --> this is for users the current user id
     *      --> this is for admins the current viewed user id
     */
    @computed
    get viewedUserId() {
        return this.store.root.userStore.viewedUserId;
    }

    /**
     * All documents which
     * - **don't have a parent**
     * - having the **same type** as this document root
     *
     * @returns All main documents, **ordered by creation date**, oldest first.
     */
    @computed
    get mainDocuments(): TypeModelMapping[T][] {
        const docs = this.documents
            .filter((d) => d.isMain)
            .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()) as TypeModelMapping[T][];
        if (this.isDummy) {
            return docs;
        }
        const byUser = docs.filter((d) => d.authorId === this.viewedUserId);

        if (
            this.store.root.userStore.current?.hasElevatedAccess &&
            this.store.root.userStore.isUserSwitched
        ) {
            return byUser;
        }

        if (NoneAccess.has(this.sharedAccess)) {
            return byUser;
        }
        return [...byUser, ...docs.filter((d) => d.authorId !== this.viewedUserId)];
    }

    @computed
    get firstMainDocument(): TypeModelMapping[T] | undefined {
        return this.mainDocuments[0];
    }

    @action
    save() {
        return this.store.save(this).catch(() => console.log('Failed to update document root'));
    }

    @computed
    get hasReadAccess() {
        return RWAccess.has(this.permission) || ROAccess.has(this.permission);
    }

    @computed
    get hasRWAccess() {
        if (this.store.root.userStore.isUserSwitched) {
            return false;
        }
        return RWAccess.has(this.permission);
    }

    @computed
    get hasAdminOrRWAccess() {
        return this.hasRWAccess || !!this.store.root.userStore.current?.hasElevatedAccess;
    }

    @computed
    get _needsInitialDocumentCreation() {
        if (!this.store.root.userStore.current || this.store.root.userStore.isUserSwitched) {
            return false;
        }
        return this.isLoaded && !this.isDummy && !this.firstMainDocument && this.hasAdminOrRWAccess;
    }

    @computed
    get _triggerDocumentReload() {
        return `${this.firstMainDocument?.id}-${this.store.root.userStore.viewedUserId}`;
    }
}

export default DocumentRoot;
