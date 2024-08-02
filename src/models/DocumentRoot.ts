import { action, computed, observable } from 'mobx';
import { DocumentRootBase as DocumentRootProps } from '../api/documentRoot';
import { DocumentRootStore } from '../stores/DocumentRootStore';
import { Access, Document, DocumentType, TypeDataMapping } from '../api/document';
import { highestAccess } from './helpers/accessPolicy';
import { TypeModelMapping } from '../stores/DocumentStore';

export abstract class TypeMeta<T extends DocumentType> {
    type: T;
    access?: Access;
    constructor(type: T, access?: Access) {
        this.type = type;
        this.access = access;
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
    readonly _isDummy: boolean;

    @observable accessor _access: Access;

    constructor(
        props: DocumentRootProps,
        meta: TypeMeta<T>,
        store: DocumentRootStore,
        isDummy: boolean = false
    ) {
        this.store = store;
        this.meta = meta;
        this.id = props.id;
        this._access = props.access;
        this._isDummy = isDummy;
    }

    @computed
    get isDummy() {
        return this._isDummy || !this.store.root.sessionStore.isLoggedIn;
    }

    get type() {
        return this.meta.type;
    }

    get access() {
        if (this.meta.access) {
            return this.meta.access;
        }
        return this.meta.access || this._access;
    }

    @computed
    get permissions() {
        return this.store.usersPermissions(this.id);
    }

    @computed
    get permission() {
        return highestAccess(new Set([...this.permissions.map((p) => p.access)]));
    }

    get documents() {
        return this.store.root.documentStore.findByDocumentRoot(this.id);
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
        return this.documents
            .filter((d) => d.isRoot && d.type === this.type)
            .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()) as TypeModelMapping[T][];
    }

    @computed
    get firstMainDocument(): TypeModelMapping[T] | undefined {
        return this.mainDocuments[0];
    }
}

export default DocumentRoot;
