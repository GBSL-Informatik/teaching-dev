import { action, computed, observable } from 'mobx';
import { RootStore } from './rootStore';
import { computedFn } from 'mobx-utils';
import {
    allDocuments as apiAllDocuments,
    create as apiCreate,
    Document as DocumentProps,
    DocumentType,
    DocumentTypes,
    remove as apiDelete,
    TypeModelMapping,
    update as apiUpdate,
    ADMIN_EDITABLE_DOCUMENTS,
    linkTo as apiLinkTo,
    Factory,
    RoomType,
    RoomTypeMapping,
    RoomFactory
} from '@tdev-api/document';
import iStore from '@tdev-stores/iStore';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import iDocument, { Source } from '@tdev-models/iDocument';
import ScriptVersion from '@tdev-models/documents/ScriptVersion';
import { ChangedDocument } from '@tdev-api/IoEventTypes';
import String from '@tdev-models/documents/String';
import QuillV2 from '@tdev-models/documents/QuillV2';
import Solution from '@tdev-models/documents/Solution';
import { RWAccess } from '@tdev-models/helpers/accessPolicy';
import Directory from '@tdev-models/documents/FileSystem/Directory';
import File from '@tdev-models/documents/FileSystem/File';
import MdxComment from '@tdev-models/documents/MdxComment';
import Restricted from '@tdev-models/documents/Restricted';
import CmsText from '@tdev-models/documents/CmsText';
import DynamicDocumentRoots from '@tdev-models/documents/DynamicDocumentRoots';
import DynamicDocumentRoot, { DynamicDocumentRootModel } from '@tdev-models/documents/DynamicDocumentRoot';
import ProgressState from '@tdev-models/documents/ProgressState';
import Script from '@tdev-models/documents/Script';
import TaskState from '@tdev-models/documents/TaskState';

const IsNotUniqueError = (error: any) => {
    try {
        const message = error.response.data;
        // @see https://github.com/GBSL-Informatik/teaching-api/blob/main/src/models/Document.ts#Document.createModel
        return /FORBIDDEN: \[403\] \[not unique\]/.test(message || '');
    } catch {
        return false;
    }
};

export function CreateDocumentModel<T extends DocumentType>(
    data: DocumentProps<T>,
    store: DocumentStore
): TypeModelMapping[T];
export function CreateDocumentModel(data: DocumentProps<DocumentType>, store: DocumentStore) {
    switch (data.type) {
        case 'script':
            return new Script(data as DocumentProps<'script'>, store);
        case 'task_state':
            return new TaskState(data as DocumentProps<'task_state'>, store);
        case 'script_version':
            return new ScriptVersion(data as DocumentProps<'script_version'>, store);
        case 'string':
            return new String(data as DocumentProps<'string'>, store);
        case 'quill_v2':
            return new QuillV2(data as DocumentProps<'quill_v2'>, store);
        case 'solution':
            return new Solution(data as DocumentProps<'solution'>, store);
        case 'dir':
            return new Directory(data as DocumentProps<'dir'>, store);
        case 'file':
            return new File(data as DocumentProps<'file'>, store);
        case 'mdx_comment':
            return new MdxComment(data as DocumentProps<'mdx_comment'>, store);
        case 'restricted':
            return new Restricted(data as DocumentProps<'restricted'>, store);
        case 'cms_text':
            return new CmsText(data as DocumentProps<'cms_text'>, store);
        case 'dynamic_document_root':
            throw new Error(`Dynamic Document Root's can't be instantiated.`);
        case 'dynamic_document_roots':
            return new DynamicDocumentRoots(data as DocumentProps<'dynamic_document_roots'>, store);
        case 'progress_state':
            return new ProgressState(data as DocumentProps<'progress_state'>, store);
    }
}

const FactoryDefault: [DocumentType, Factory][] = [
    ['script', CreateDocumentModel],
    ['task_state', CreateDocumentModel],
    ['progress_state', CreateDocumentModel],
    ['script_version', CreateDocumentModel],
    ['string', CreateDocumentModel],
    ['quill_v2', CreateDocumentModel],
    ['solution', CreateDocumentModel],
    ['dir', CreateDocumentModel],
    ['file', CreateDocumentModel],
    ['mdx_comment', CreateDocumentModel],
    ['restricted', CreateDocumentModel],
    ['cms_text', CreateDocumentModel],
    ['dynamic_document_root', CreateDocumentModel],
    ['dynamic_document_roots', CreateDocumentModel]
];

class DocumentStore extends iStore<`delete-${string}`> {
    readonly root: RootStore;
    documents = observable.array<DocumentTypes>([]);
    factories = new Map<DocumentType, Factory>(FactoryDefault);
    roomFactories = new Map<RoomType, RoomFactory>();

    constructor(root: RootStore) {
        super();
        this.root = root;
    }

    find = computedFn(
        function (this: DocumentStore, id?: string | null): DocumentTypes | undefined {
            if (!id) {
                return undefined;
            }
            return this.documents.find((d) => d.id === id);
        },
        { keepAlive: true }
    );

    registerFactory(type: DocumentType, factory: Factory) {
        this.factories.set(type, factory);
    }

    @computed
    get documentTypes() {
        return Array.from(this.factories.keys()) as DocumentType[];
    }

    createDocument<Type extends DocumentType>(data: DocumentProps<Type>): TypeModelMapping[Type] | null {
        const factory = this.factories.get(data.type);
        if (!factory) {
            console.warn(`No factory registered for document type ${data.type}`);
            return null;
        }
        return factory(data, this) as TypeModelMapping[Type];
    }

    registerRoomFactory(type: RoomType, factory: RoomFactory) {
        this.roomFactories.set(type, factory);
    }

    createRoom<Type extends RoomType>(docRoot: DynamicDocumentRoot<Type>): RoomTypeMapping[Type] | null {
        const factory = this.roomFactories.get(docRoot.roomType);
        if (!factory) {
            console.warn(`No factory registered for document type ${docRoot.roomType}`);
            return null;
        }
        return factory(docRoot, this.root.documentStore) as RoomTypeMapping[Type];
    }

    @action
    addDocument(document: DocumentTypes) {
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

    byParentId = computedFn(
        function (this: DocumentStore, parentId?: string) {
            if (!parentId) {
                return [] as DocumentTypes[];
            }
            return this.documents.filter((d) => d.parentId === parentId);
        },
        { keepAlive: true }
    );

    @action
    addToStore<Type extends DocumentType>(
        data: DocumentProps<Type> | undefined | null
    ): TypeModelMapping[Type] | undefined {
        /**
         * Adds a new model to the store. Existing models with the same id are replaced.
         */
        if (!data || !data.data) {
            return;
        }
        const factory = this.factories.get(data.type);
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
        const old = this.find(model.id);
        this.removeFromStore(old);
        this.documents.push(model);
        return model as TypeModelMapping[Type];
    }

    @action
    removeFromStore(document?: DocumentTypes, cleanupDeep?: boolean): DocumentTypes | undefined {
        /**
         * Removes the model to the store
         */
        if (document) {
            this.documents.remove(document);
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
                            const factory = this.factories.get(data.type);
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
        model: { documentRootId: string; type: Type } & Partial<DocumentProps<Type>>,
        isMain: boolean = false
    ) {
        const rootDoc = this.root.documentRootStore.find(model.documentRootId);
        if (!rootDoc || rootDoc.isDummy) {
            return Promise.resolve(undefined);
        }
        const hasAccess = RWAccess.has(rootDoc.permission) || this.root.userStore.current?.hasElevatedAccess;
        if (!hasAccess) {
            return Promise.resolve(undefined);
        }
        const onBehalfOf =
            model.authorId !== this.root.userStore.current?.id &&
            ADMIN_EDITABLE_DOCUMENTS.includes(model.type);
        return this.withAbortController(`create-${model.id || uuidv4()}`, (sig) => {
            return apiCreate<Type>(model, onBehalfOf, isMain, sig.signal);
        })
            .then(
                action(({ data }) => {
                    return this.addToStore(data);
                })
            )
            .catch((err) => {
                if (!axios.isCancel(err)) {
                    if (IsNotUniqueError(err)) {
                        const docRoot = this.root.documentRootStore.find(model.documentRootId);
                        if ((docRoot?.mainDocuments?.length || 0) < 1) {
                            console.log('The main document must be unique - try to load it from the api.');
                            return this.root.documentRootStore.loadInNextBatch(model.documentRootId);
                        }
                    }
                    console.warn('Error creating document', err);
                }
                return undefined;
            });
    }

    @action
    handleUpdate(change: ChangedDocument) {
        console.log('DocumentStore.handleUpdate', change);
        const model = this.find(change.id);
        if (model) {
            const updatedAt = new Date(change.updatedAt);
            if (model.updatedAt.getTime() >= updatedAt.getTime()) {
                // ignore stalled updates
                return;
            }
            model.setData(change.data as any, Source.API, updatedAt);
        }
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

    @action
    apiDelete(document: DocumentTypes) {
        if (document.authorId !== this.root.userStore.current?.id) {
            return;
        }
        return this.withAbortController(`delete-${document.id}`, (sig) => {
            return apiDelete(document.id, sig.signal);
        })
            .then(({ data }) => {
                this.removeFromStore(document);
            })
            .catch((err) => {
                console.warn('Error deleting document', err);
                this.removeFromStore(document);
            });
    }

    @action
    relinkParent(document: DocumentTypes, newParent: DocumentTypes) {
        return this.withAbortController(`save-${document.id}`, (sig) => {
            return apiLinkTo(document.id, newParent.id, sig.signal);
        })
            .then((res) => {
                this.addToStore(res.data);
            })
            .catch((err) => {
                console.warn('Relinking not possible', err);
                document.reset();
            });
    }
}

export default DocumentStore;
