import { action, computed, observable } from 'mobx';
import { DocumentRootBase as DocumentRootProps } from '@tdev-api/documentRoot';
import { DocumentRootStore } from '@tdev-stores/DocumentRootStore';
import { Access, DocumentType, TypeDataMapping, TypeModelMapping } from '@tdev-api/document';
import { highestAccess, leveledAccess, NoneAccess, ROAccess, RWAccess } from './helpers/accessPolicy';
import { isDummyId } from '@tdev-hooks/useDummyId';
import { orderBy } from 'es-toolkit/array';
import { Hashery } from 'hashery';

/**
 * removes react specific props from the object:
 * - children
 * - props
 * - ref
 */
// const sanitizedProps = (props: any) => {
//     if (props.props) {
//         console.log('sanitizedProps called with props:', props, props.props);
//     }
//     const {
//         children,
//         // ref,
//         // className,
//         // style,
//         suppressContentEditableWarning,
//         suppressHydrationWarning,
//         dangerouslySetInnerHTML,
//         ...rest
//     } = props;
//     return rest;
// };

export const MetaHasher = new Hashery({
    cache: { enabled: true, maxSize: 500 }
});

interface BaseMetaProps {
    access?: Access;
    readonly?: boolean;
    pagePosition?: number;
}

export abstract class TypeMeta<T extends DocumentType> {
    readonly pagePosition: number;
    readonly props: BaseMetaProps;
    type: T;
    access?: Access;
    constructor(type: T, props: BaseMetaProps = {}, useMinimalProps: boolean = false) {
        this.type = type;
        this.access = props.access ?? (props.readonly ? Access.RO_User : undefined);
        this.pagePosition = props.pagePosition || 0;
        this.props = useMinimalProps ? { access: this.access, pagePosition: this.pagePosition } : props;
    }
    abstract get defaultData(): TypeDataMapping[T];
}

class DocumentRoot<T extends DocumentType> {
    readonly store: DocumentRootStore;
    readonly id: string;
    readonly meta: TypeMeta<T>;
    readonly _metaHash: string;
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
        this._metaHash = MetaHasher.toHashSync(meta.props);
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

    get isUnknown() {
        return this.type === '_unknown_';
    }

    get access() {
        return highestAccess(new Set([this._access]), this.meta.access);
    }

    get rootAccess() {
        return this._access;
    }

    @action
    setRootAccess(access: Access, skipSave: boolean = false) {
        if (this._access === access) {
            return Promise.resolve();
        }
        this._access = access;
        if (skipSave) {
            return Promise.resolve();
        }
        return this.save();
    }

    get sharedAccess() {
        return this._sharedAccess;
    }

    @action
    setSharedAccess(access: Access, skipSave: boolean = false) {
        if (this._sharedAccess === access) {
            return Promise.resolve();
        }
        this._sharedAccess = access;
        if (skipSave) {
            return Promise.resolve();
        }
        return this.save();
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

    /**
     * use this when you want current user's shared permission. It handles correct leveling
     * of access between the document root's access and the shared access.
     */
    @computed
    get sharedPermission() {
        if (NoneAccess.has(this.permission) || NoneAccess.has(this.sharedAccess)) {
            return leveledAccess(Access.None_DocumentRoot, this.permission);
        }

        if (ROAccess.has(this.permission) || ROAccess.has(this.sharedAccess)) {
            return leveledAccess(Access.RO_DocumentRoot, this.permission);
        }
        return leveledAccess(this.sharedAccess, this.permission);
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
                (!NoneAccess.has(this.sharedAccess) && !NoneAccess.has(this.permission))
            );
        });
        return docs;
    }

    /**
     * All documents which are related to this document root.
     * This method should be used only for admin users or when the author-filtering is
     * applied afterwards.
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

    @computed
    get documentsByType(): Map<DocumentType, TypeModelMapping[DocumentType][]> {
        return orderBy(this.documents, ['createdAt', 'id'], ['asc', 'asc']).reduce((map, doc) => {
            const docs = map.get(doc.type) || [];
            if (docs.length === 0) {
                map.set(doc.type, docs);
            }
            docs.push(doc);
            return map;
        }, new Map<DocumentType, TypeModelMapping[DocumentType][]>());
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

    /**
     * returns true if the document root is loaded and the current user has admin or RW access.
     */
    @computed
    get _canInitializeDocuments() {
        if (!this.store.root.userStore.current || this.store.root.userStore.isUserSwitched) {
            return false;
        }
        return this.isLoaded && !this.isDummy && this.hasAdminOrRWAccess;
    }

    @computed
    get _needsInitialDocumentCreation() {
        return this._canInitializeDocuments && !this.documentsByType.has(this.meta.type);
    }

    @computed
    get _triggerDocumentReload() {
        const firstMainDoc = this.documentsByType.get(this.meta.type)?.[0];
        return `${firstMainDoc?.id}-${this.store.root.userStore.viewedUserId}`;
    }
}

export default DocumentRoot;
