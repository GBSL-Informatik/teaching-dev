import { action, computed, observable } from 'mobx';
import { RootStore } from './rootStore';
import { computedFn } from 'mobx-utils';
import {
    allDocuments as apiAllDocuments,
    create as apiCreate,
    Document as DocumentProps,
    DocumentType,
    DocumentTypes,
    find as apiFind,
    remove as apiDelete,
    TypeModelMapping,
    update as apiUpdate,
    ADMIN_EDITABLE_DOCUMENTS,
    linkTo as apiLinkTo
} from '@tdev-api/document';
import Script from '@tdev-models/documents/Script';
import TaskState from '@tdev-models/documents/TaskState';
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
import TextMessage from '@tdev-models/documents/TextMessage';
import DynamicDocumentRoots from '@tdev-models/documents/DynamicDocumentRoots';
import { DynamicDocumentRootModel } from '@tdev-models/documents/DynamicDocumentRoot';
import NetpbmGraphic from '@tdev-models/documents/NetpbmGraphic';
import Excalidoc from '@tdev/excalidoc/model';
import ProgressState from '@tdev-models/documents/ProgressState';

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
export function CreateDocumentModel(data: DocumentProps<DocumentType>, store: DocumentStore): DocumentTypes {
    switch (data.type) {
        case DocumentType.Script:
            return new Script(data as DocumentProps<DocumentType.Script>, store);
        case DocumentType.TaskState:
            return new TaskState(data as DocumentProps<DocumentType.TaskState>, store);
        case DocumentType.ScriptVersion:
            return new ScriptVersion(data as DocumentProps<DocumentType.ScriptVersion>, store);
        case DocumentType.String:
            return new String(data as DocumentProps<DocumentType.String>, store);
        case DocumentType.QuillV2:
            return new QuillV2(data as DocumentProps<DocumentType.QuillV2>, store);
        case DocumentType.Solution:
            return new Solution(data as DocumentProps<DocumentType.Solution>, store);
        case DocumentType.Dir:
            return new Directory(data as DocumentProps<DocumentType.Dir>, store);
        case DocumentType.File:
            return new File(data as DocumentProps<DocumentType.File>, store);
        case DocumentType.MdxComment:
            return new MdxComment(data as DocumentProps<DocumentType.MdxComment>, store);
        case DocumentType.Restricted:
            return new Restricted(data as DocumentProps<DocumentType.Restricted>, store);
        case DocumentType.CmsText:
            return new CmsText(data as DocumentProps<DocumentType.CmsText>, store);
        case DocumentType.Excalidoc:
            return new Excalidoc(data as DocumentProps<DocumentType.Excalidoc>, store);
        case DocumentType.TextMessage:
            return new TextMessage(data as DocumentProps<DocumentType.TextMessage>, store);
        case DocumentType.DynamicDocumentRoot:
            return new DynamicDocumentRootModel(
                data as DocumentProps<DocumentType.DynamicDocumentRoot>,
                store
            );
        case DocumentType.DynamicDocumentRoots:
            return new DynamicDocumentRoots(data as DocumentProps<DocumentType.DynamicDocumentRoots>, store);
        case DocumentType.NetpbmGraphic:
            return new NetpbmGraphic(data as DocumentProps<DocumentType.NetpbmGraphic>, store);
        case DocumentType.ProgressState:
            return new ProgressState(data as DocumentProps<DocumentType.ProgressState>, store);
    }
}

type Factory = (data: DocumentProps<DocumentType>, store: DocumentStore) => DocumentTypes;

class DocumentStore extends iStore<`delete-${string}`> {
    readonly root: RootStore;
    documents = observable.array<DocumentTypes>([]);
    factories = new Map<string, Factory>();

    constructor(root: RootStore) {
        super();
        this.root = root;
    }

    registerFactory<T>(type: string, factory: Factory) {
        this.factories.set(type, factory);
    }

    createDocument(data: DocumentProps<DocumentType>) {
        const factory = this.factories.get(data.type);
        if (!factory) {
            return null;
        }
        return factory(data, this);
    }

    @action
    addDocument(document: DocumentTypes) {
        this.documents.push(document);
    }

    find = computedFn(
        function (this: DocumentStore, id?: string | null) {
            if (!id) {
                return;
            }
            return this.documents.find((d) => d.id === id);
        },
        { keepAlive: true }
    );

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
        const model = CreateDocumentModel(data, this);
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
                            return CreateDocumentModel(data, this);
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
        const model = this.find(change.id);
        if (model) {
            model.setData(change.data as any, Source.API, new Date(change.updatedAt));
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
