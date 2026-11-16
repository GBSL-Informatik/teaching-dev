import {
    Access,
    ADMIN_EDITABLE_DOCUMENTS,
    allDocuments as apiAllDocuments,
    create as apiCreate,
    remove as apiDelete,
    linkTo as apiLinkTo,
    update as apiUpdate,
    updateConstraints as apiUpdateConstraints,
    DocumentModelType,
    Document as DocumentProps,
    DocumentType,
    Factory,
    TypeModelMapping,
    UniquenessConstraints
} from '@tdev-api/document';
import { ChangedDocument } from '@tdev-api/IoEventTypes';
import DocumentRoot, { MetaHasher, TypeMeta } from '@tdev-models/DocumentRoot';
import iFileSystem from '@tdev-models/documents/FileSystem/iFileSystem';
import { RWAccess } from '@tdev-models/helpers/accessPolicy';
import iDocument, { Source } from '@tdev-models/iDocument';
import StudentGroup from '@tdev-models/StudentGroup';
import iStore from '@tdev-stores/iStore';
import { isStalledUpdate } from '@tdev/helpers/isStalledUpdate';
import axios from 'axios';
import { action, computed, observable } from 'mobx';
import { computedFn } from 'mobx-utils';
import { v4 as uuidv4 } from 'uuid';
import { BuiltinDocumentTypes } from './assets/BuiltinDocumentTypes';
import { FileConfig } from './assets/FileExtensions';
import { RootStore } from './rootStore';

export interface DocumentTypeConfig<T extends DocumentType> {
    type: T;
    factory: Factory<T>;
    /** used for document roots whose documents are loaded without a meta, e.g. in admin views */
    defaultMeta?: TypeMeta<T>;
    /** makes the type creatable as a file in the file system (`dir` and `file` documents) */
    fileExtensions?: FileConfig<T>[];
    /** add documents of this type to the store when the socket announces them as new records */
    createOnNewRecord?: boolean;
    /** counts towards the task progress of a page */
    taskable?: boolean;
}

/**
 * One `DocumentTypeConfig` per type, so the `factory` and the `fileExtensions` are checked against their `type`.
 */
export type AnyDocumentTypeConfig = { [T in DocumentType]: DocumentTypeConfig<T> }[DocumentType];

const DEFAULT_FILE_PRIORITY = 10;

class DocumentStore extends iStore<`delete-${string}` | `move-${string}` | `update-${string}`> {
    readonly root: RootStore;
    documents = observable.array<DocumentModelType>([]);
    private documentTypeConfigs = observable.map<DocumentType, DocumentTypeConfig<DocumentType>>(
        {},
        { deep: false }
    );

    constructor(root: RootStore) {
        super();
        this.root = root;
        BuiltinDocumentTypes.forEach((config) => this.registerDocumentType(config));
    }

    find = computedFn(
        function (this: DocumentStore, id?: string | null): DocumentModelType | undefined {
            if (!id) {
                return undefined;
            }
            return this.documents.find((d) => d.id === id);
        },
        { keepAlive: true }
    );

    /**
     * Registering a type again replaces its previous config, e.g. to override a built-in type.
     */
    @action
    registerDocumentType(config: AnyDocumentTypeConfig) {
        if (this.documentTypeConfigs.has(config.type)) {
            console.warn(`Document type ${config.type} is already registered, replacing it`);
        }
        const fileExtensions = config.fileExtensions?.map((fileConfig) => ({
            ...fileConfig,
            priority: fileConfig.priority ?? DEFAULT_FILE_PRIORITY
        }));
        // erases the per-type generic: the map is keyed by `type`, so each factory still gets its own type
        const registered = { ...config, fileExtensions } as unknown as DocumentTypeConfig<DocumentType>;
        this.documentTypeConfigs.set(config.type, registered);
    }

    @computed
    get documentTypes(): DocumentType[] {
        return [...this.documentTypeConfigs.keys()];
    }

    @computed
    get fileExtensions(): Map<DocumentType, FileConfig<DocumentType>[]> {
        const typesWithFiles = [...this.documentTypeConfigs.values()].filter(
            (config) => config.fileExtensions?.length
        );
        return new Map(typesWithFiles.map((config) => [config.type, config.fileExtensions!]));
    }

    @computed
    get registeredFileExtensions() {
        return [...this.fileExtensions.values()].flat();
    }

    @computed
    get defaultMetas(): TypeMeta<DocumentType>[] {
        return [...this.documentTypeConfigs.values()]
            .map((config) => config.defaultMeta)
            .filter((meta) => !!meta);
    }

    @computed
    get taskableTypes(): Set<DocumentType> {
        const taskableConfigs = [...this.documentTypeConfigs.values()].filter((config) => config.taskable);
        return new Set(taskableConfigs.map((config) => config.type));
    }

    isCreatedOnNewRecord(type: DocumentType): boolean {
        return !!this.documentTypeConfigs.get(type)?.createOnNewRecord;
    }

    createDocument<Type extends DocumentType>(data: DocumentProps<Type>): TypeModelMapping[Type] | null {
        const factory = this.factoryOf(data.type);
        if (!factory) {
            console.warn(`No factory registered for document type ${data.type}`);
            return null;
        }
        return factory(data, this) as TypeModelMapping[Type];
    }

    @action
    addDocument(document: DocumentModelType) {
        this.documents.push(document);
    }

    findByDocumentRoot = computedFn(
        function (this: DocumentStore, documentRootId?: string) {
            if (!documentRootId) {
                return [];
            }
            return this.documents.filter((d) => d.documentRootId === documentRootId);
        },
        { keepAlive: true }
    );

    byDocumentType = computedFn(
        function (this: DocumentStore, documentType: DocumentType): TypeModelMapping[typeof documentType][] {
            if (!documentType) {
                return [];
            }
            return this.documents.filter((d) => d.type === documentType);
        },
        { keepAlive: true }
    );

    byParentId = computedFn(
        function (this: DocumentStore, parentId?: string) {
            if (!parentId) {
                return [] as DocumentModelType[];
            }
            return this.documents.filter((d) => d.parentId === parentId);
        },
        { keepAlive: true }
    );

    @computed
    get presentedDocuments() {
        return [...this.root.studentGroupStore.presentedDocumentIds]
            .map((id) => this.find(id))
            .filter((d) => !!d);
    }

    @computed
    get hasPresentingDocuments() {
        return this.presentedDocuments.length > 0;
    }

    @action
    addToStore<Type extends DocumentType>(
        data: DocumentProps<Type> | undefined | null,
        checkStalledState: boolean = false
    ): TypeModelMapping[Type] | undefined {
        /**
         * Adds a new model to the store. Existing models with the same id are replaced.
         */
        if (!data) {
            return;
        }
        const old = this.find(data.id);
        if (old && checkStalledState) {
            if (isStalledUpdate(old, data)) {
                // Ignore stale/equal payloads to avoid regressing already streamed data.
                return old as TypeModelMapping[Type];
            }
        }
        const factory = this.factoryOf(data.type);
        if (!factory) {
            return;
        }
        const model = factory(data, this);

        // TODO: should we try to load the root in this case?
        if (!model?.root) {
            return;
        }

        /**
         * don't add a persisted model to a dummy root
         */
        if (model.root.isDummy) {
            return;
        }

        // check if the model extends iAssessable
        if ('inQuiz' in model && model.inQuiz) {
            const oldAssessable = this.root.documentRootStore
                .find(model.documentRootId)
                ?.allDocuments.find(
                    (d) => d.type === model.type && d.qid === model.qid && d.authorId === model.authorId
                );
            this.removeFromStore(oldAssessable);
        }
        this.removeFromStore(old);
        this.documents.push(model);
        return model as TypeModelMapping[Type];
    }

    @action
    removeFromStore<T extends DocumentModelType | iDocument<any>>(
        document?: T,
        cleanupDeep?: boolean
    ): T | undefined {
        /**
         * Removes the model to the store
         */
        if (document) {
            this.documents.remove(document as DocumentModelType);
            document.cleanup(cleanupDeep);
        }
        return document;
    }

    @computed
    get canSave() {
        return this.root.sessionStore.isLoggedIn;
    }

    @action
    save<Type extends DocumentType>(
        model: iDocument<Type>,
        replaceStoreModel: boolean = false
    ): Promise<TypeModelMapping[Type] | 'error' | undefined> {
        if (!model.root || model.root?.isDummy || !this.root.sessionStore.isLoggedIn) {
            return Promise.resolve('error');
        }
        if (model.isDirty) {
            const { id } = model;
            const hasAdminAccess =
                !!this.root.userStore.current?.hasElevatedAccess &&
                (model.authorId === this.root.userStore.current.id ||
                    ADMIN_EDITABLE_DOCUMENTS.includes(model.type));
            if (!model.canEdit && !hasAdminAccess) {
                return Promise.resolve('error');
            }
            if (!RWAccess.has(model.root.permission) && !hasAdminAccess) {
                return Promise.resolve('error');
            }
            const onBehalfOf = model.authorId !== this.root.userStore.current?.id && hasAdminAccess;
            return this.withAbortController(`save-${id}`, (sig) => {
                return apiUpdate(model.id, model.data, onBehalfOf, sig.signal);
            })
                .then(
                    action(({ data }) => {
                        if (data) {
                            if (replaceStoreModel) {
                                return this.addToStore(data);
                            }
                            const factory = this.factoryOf(data.type);
                            if (!factory) {
                                return undefined;
                            }
                            return factory(data, this) as TypeModelMapping[Type];
                        }
                        return undefined;
                    })
                )
                .catch((err) => {
                    if (!axios.isCancel(err)) {
                        console.warn('Error saving document', err);
                    }
                    return 'error';
                });
        }
        return Promise.resolve(undefined);
    }

    @action
    create<Type extends DocumentType>(
        model: { documentRootId: string; type: Type } & Partial<DocumentProps<Type>>
    ) {
        const rootDoc = this.root.documentRootStore.find(model.documentRootId);
        if (!rootDoc || rootDoc.isDummy) {
            return Promise.resolve(undefined);
        }
        if (!rootDoc.hasAdminOrRWAccess) {
            return Promise.resolve(undefined);
        }
        const preTasks: Promise<any>[] = [];
        if (!rootDoc.hasRWAccess && rootDoc.hasAdminOrRWAccess) {
            /**
             * obviously, the current user is an admin, but no permission was given so far.
             * -> add RW access for the current user, so that the document creation can proceed.
             */
            preTasks.push(
                this.root.permissionStore.createUserPermission(
                    rootDoc.id,
                    this.root.userStore.current!,
                    Access.RW_User
                )
            );
        }
        const onBehalfOf =
            model.authorId !== this.root.userStore.current?.id &&
            ADMIN_EDITABLE_DOCUMENTS.includes(model.type);
        return Promise.all(preTasks)
            .then(() =>
                this.withAbortController(`create-${model.id || uuidv4()}`, (sig) => {
                    return apiCreate<Type>(model, onBehalfOf, sig.signal);
                })
            )
            .then(
                action(({ data }) => {
                    return this.addToStore(data);
                })
            )
            .catch((err) => {
                if (!axios.isCancel(err)) {
                    console.warn('Error creating document', err);
                }
                return undefined;
            });
    }

    @action
    handleUpdate(change: ChangedDocument) {
        const model = this.find(change.id);
        if (model) {
            if (isStalledUpdate(model, change)) {
                return;
            }
            const updatedAt = new Date(change.updatedAt);
            model.setData(change.data as any, Source.API, updatedAt);
            setTimeout(() => {
                model.postUpdate(change.meta);
            }, 0);
        }
    }

    @action
    addPresentedDocumentToStore(studentGroup: StudentGroup) {
        const presentedDoc = studentGroup.presentedDocumentProps;
        if (!presentedDoc || !studentGroup.canPresent) {
            return;
        }
        const rawDoc = presentedDoc.document;
        const rawMeta = presentedDoc.meta;
        const model = this.find(rawDoc.id);
        if (model) {
            return;
        }
        const docRoot = this.root.documentRootStore.find(rawDoc.documentRootId);
        const metaHash = MetaHasher.toHashSync(rawMeta.props);
        if (!docRoot || !docRoot?.isDummy || docRoot._metaHash !== metaHash) {
            this.root.documentRootStore.addDocumentRoot(
                new DocumentRoot(
                    {
                        id: rawDoc.documentRootId,
                        access: presentedDoc.access,
                        sharedAccess: presentedDoc.sharedAccess
                    },
                    rawMeta,
                    this.root.documentRootStore,
                    false
                )
            );
        }
        const documentRoot = this.root.documentRootStore.find(rawDoc.documentRootId);
        if (!documentRoot) {
            return;
        }

        this.addToStore(rawDoc, true);
    }

    @action
    apiLoadDocumentsFrom(rootIds: string[]) {
        if (!this.root.userStore.current?.hasElevatedAccess) {
            return Promise.resolve([]);
        }
        return this.withAbortController(`load-docs-${rootIds.join('::')}`, (sig) => {
            return apiAllDocuments(rootIds, sig.signal);
        }).then(({ data }) => {
            const models = Promise.all(
                data.map((doc) => {
                    return this.addToStore(doc);
                })
            );
            return models;
        });
    }

    /**
     * Loads another author's documents with their data, even when the author's own
     * access to the document root is `None` (e.g. a locked task).
     */
    @action
    apiLoadDocumentsOfAuthor(authorId: string, documentRootId: string, documentType: DocumentType) {
        if (!this.root.userStore.current?.hasElevatedAccess) {
            return Promise.resolve([]);
        }
        return this.withAbortController(`load-${documentType}-of-${authorId}-${documentRootId}`, (sig) => {
            return apiAllDocuments([documentRootId], sig.signal, authorId);
        }).then(({ data }) => {
            const documents = (data ?? []).filter((doc) => doc.type === documentType);
            return documents.map((doc) => this.addToStore(doc));
        });
    }

    @action
    apiDelete(document: DocumentModelType | iDocument<any>): Promise<boolean> {
        if (document.authorId !== this.root.userStore.current?.id) {
            return Promise.resolve(false);
        }
        let signal: AbortSignal;
        return this.withAbortController(`delete-${document.id}`, (sig) => {
            signal = sig.signal;
            return apiDelete(document.id, sig.signal);
        })
            .then(({ data }) => {
                if (signal.aborted) {
                    return false;
                }
                this.removeFromStore(document, true);
                return true;
            })
            .catch((err) => {
                console.warn('Error deleting document', err);
                return false;
            });
    }

    @action
    relinkParent(
        document: DocumentModelType | iFileSystem,
        newParent: DocumentModelType | iFileSystem
    ): Promise<boolean> {
        let signal: AbortSignal;
        return this.withAbortController(`move-${document.id}`, (sig) => {
            signal = sig.signal;
            return apiLinkTo(document.id, newParent.id, sig.signal);
        })
            .then((res) => {
                if (signal.aborted || !res.data || res.data.parentId !== newParent.id) {
                    return false;
                }
                return !!this.addToStore(res.data);
            })
            .catch((err) => {
                console.warn('Relinking not possible', err);
                return false;
            });
    }

    @action
    updateConstraints<T extends DocumentType>(
        document: TypeModelMapping[T],
        constraints: UniquenessConstraints
    ): Promise<TypeModelMapping[T] | undefined> {
        let signal: AbortSignal;
        return this.withAbortController(`update-${document.id}`, (sig) => {
            signal = sig.signal;
            return apiUpdateConstraints<T>(document.id, constraints, sig.signal);
        })
            .then((res) => {
                if (signal.aborted) {
                    return undefined;
                }
                return this.addToStore<T>(res.data);
            })
            .catch((err) => {
                console.warn('Error updating constraints', err);
                return undefined;
            });
    }

    private factoryOf(type: DocumentType): Factory | undefined {
        return this.documentTypeConfigs.get(type)?.factory;
    }
}

export default DocumentStore;
