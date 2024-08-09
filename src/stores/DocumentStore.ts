import { action, observable } from 'mobx';
import { RootStore } from './rootStore';
import { computedFn } from 'mobx-utils';
import {
    Document as DocumentProps,
    DocumentType,
    find as apiFind,
    update as apiUpdate,
    create as apiCreate,
    Access,
    DocumentTypes,
    TypeModelMapping
} from '@site/src/api/document';
import Script from '@site/src/models/documents/Script';
import TaskState from '@site/src/models/documents/TaskState';
import iStore from './iStore';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import iDocument, { Source } from '../models/iDocument';
import ScriptVersion from '../models/documents/ScriptVersion';
import { ChangedDocument } from '../api/IoEventTypes';
import String from '../models/documents/String';
import QuillV2 from '../models/documents/QuillV2';

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
    }
}
class DocumentStore extends iStore {
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
        function (this: DocumentStore, id?: string) {
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

    @action
    addToStore<Type extends DocumentType>(
        data: DocumentProps<Type> | undefined | null,
        onlyFor?: 'dummy-root' | 'persisted-root'
    ): TypeModelMapping[Type] | undefined {
        /**
         * Adds a new model to the store. Existing models with the same id are replaced.
         */
        if (!data) {
            return;
        }

        const model = CreateDocumentModel(data, this);
        if (onlyFor === 'dummy-root' && (!model.root || !model.root.isDummy)) {
            return;
        }
        if (onlyFor === 'persisted-root' && (!model.root || model.root.isDummy)) {
            return;
        }

        this.removeFromStore(model.id);
        this.documents.push(model);
        return model as TypeModelMapping[Type];
    }

    @action
    removeFromStore(id: string): DocumentTypes | undefined {
        /**
         * Removes the model to the store
         */
        const old = this.find(id);
        if (old) {
            this.documents.remove(old);
            old.cleanup();
        }
        return old;
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
                        return this.addToStore(data, 'persisted-root');
                    } else {
                        /** apparently the model is not present anymore - remove it from the store */
                        return this.removeFromStore(id);
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
                    this.removeFromStore(id);
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
            if (model.root.permission !== Access.RW) {
                return Promise.resolve(undefined);
            }
            return this.withAbortController(`save-${id}`, (sig) => {
                return apiUpdate(model.id, model.data, sig.signal);
            })
                .then(
                    action(({ data }) => {
                        if (data) {
                            if (replaceStoreModel) {
                                return this.addToStore(data, 'persisted-root');
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
            return Promise.resolve('error');
        }
        if (rootDoc.permission !== Access.RW) {
            return Promise.resolve('error');
        }
        return this.withAbortController(`create-${model.id || uuidv4()}`, (sig) => {
            return apiCreate<Type>(model, sig.signal);
        })
            .then(
                action(({ data }) => {
                    return this.addToStore(data, 'persisted-root');
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
}

export default DocumentStore;
