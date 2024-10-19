import { action, observable } from 'mobx';
import { RootStore } from './rootStore';
import { computedFn } from 'mobx-utils';
import {
    Document as DocumentProps,
    DocumentType,
    find as apiFind,
    update as apiUpdate,
    create as apiCreate,
    remove as apiDelete,
    DocumentTypes,
    TypeModelMapping,
    allDocuments as apiAllDocuments
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
    }
}
class DocumentStore extends iStore<`delete-${string}`> {
    readonly root: RootStore;
    documents = observable.array<DocumentTypes>([]);

    constructor(root: RootStore) {
        super();
        this.root = root;
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
        if (!data) {
            return;
        }
        const model = CreateDocumentModel(data, this);
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

    @action
    loadModel<Type extends DocumentType>(id: string) {
        if (!id) {
            return Promise.resolve(undefined);
        }
        return this.withAbortController(`load-${id}`, (sig) => {
            return apiFind<Type>(id, sig.signal);
        })
            .then(
                action(({ data }) => {
                    if (data && Object.keys(data).length > 0) {
                        return this.addToStore(data);
                    } else {
                        /** apparently the model is not present anymore - remove it from the store */
                        const old = this.find(id);
                        return this.removeFromStore(old);
                    }
                })
            )
            .catch((err) => {
                if (axios.isCancel(err)) {
                    return;
                } else if (err.response) {
                    /**
                     * https://github.com/axios/axios#handling-errors
                     * the api responded with a non-2xx status code - apparently the model is not present anymore
                     * and can/should be removed from the store
                     */
                    const old = this.find(id);
                    this.removeFromStore(old);
                    return;
                }
            });
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
            if (!model.canEdit) {
                return Promise.resolve(undefined);
            }
            if (!RWAccess.has(model.root.permission)) {
                return Promise.resolve(undefined);
            }
            return this.withAbortController(`save-${id}`, (sig) => {
                return apiUpdate(model.id, model.data, sig.signal);
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
        model: { documentRootId: string; type: Type } & Partial<DocumentProps<Type>>
    ) {
        const rootDoc = this.root.documentRootStore.find(model.documentRootId);
        if (!rootDoc || rootDoc.isDummy) {
            return Promise.resolve(undefined);
        }
        if (!RWAccess.has(rootDoc.permission)) {
            return Promise.resolve(undefined);
        }
        return this.withAbortController(`create-${model.id || uuidv4()}`, (sig) => {
            return apiCreate<Type>(model, sig.signal);
        })
            .then(
                action(({ data }) => {
                    return this.addToStore(data);
                })
            )
            .catch((err) => {
                if (!axios.isCancel(err)) {
                    console.warn('Error saving document', err);
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
        if (!this.root.userStore.current?.isAdmin) {
            return;
        }
        return this.withAbortController(`load-docs-${rootIds.join('::')}`, (sig) => {
            return apiAllDocuments(rootIds, sig.signal);
        }).then(({ data }) => {
            console.log(data);
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
}

export default DocumentStore;
