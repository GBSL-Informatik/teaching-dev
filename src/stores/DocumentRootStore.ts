import { action, computed, observable, runInAction } from 'mobx';
import { RootStore } from '@tdev-stores/rootStore';
import { computedFn } from 'mobx-utils';
import DocumentRoot, { TypeMeta } from '@tdev-models/DocumentRoot';
import {
    Config,
    create as apiCreate,
    DocumentRootUpdate,
    remove as apiDelete,
    findManyFor as apiFindManyFor,
    update as apiUpdate,
    DocumentRoot as ApiDocumentRoot
} from '@tdev-api/documentRoot';
import iStore from '@tdev-stores/iStore';
import GroupPermission from '@tdev-models/GroupPermission';
import UserPermission from '@tdev-models/UserPermission';
import { DocumentType } from '@tdev-api/document';
import _ from 'es-toolkit/compat';
import User from '@tdev-models/User';
import { NoneAccess } from '@tdev-models/helpers/accessPolicy';

type LoadConfig = {
    documents?: boolean;
    userPermissions?: boolean;
    groupPermissions?: boolean;
    documentRoot?: boolean;
    /**
     * if a document root should not be created when it is not found,
     * set `skipCreate` to true
     */
    skipCreate?: boolean;
};

type BatchedMeta = {
    load: LoadConfig;
    meta?: TypeMeta<any>;
    access: Partial<Config>;
};

export class DocumentRootStore extends iStore {
    readonly root: RootStore;
    documentRoots = observable.array<DocumentRoot<DocumentType>>([]);
    createAttempts = new Map<string, number>();
    queued = new Map<string, BatchedMeta>();

    constructor(root: RootStore) {
        super();
        this.root = root;
    }

    @computed
    get hasApiAccess() {
        return this.root.sessionStore.isLoggedIn;
    }

    @action
    addDocumentRoot(
        documentRoot: DocumentRoot<DocumentType>,
        config: { cleanup?: boolean; deep?: boolean } = {}
    ) {
        const old = this.find(documentRoot.id);
        if (old) {
            this.documentRoots.remove(old);
            if (config.cleanup) {
                this.cleanupDocumentRoot(old, config.deep);
            }
        }
        this.documentRoots.push(documentRoot);
        return documentRoot;
    }

    find = computedFn(
        function <Type extends DocumentType = DocumentType>(
            this: DocumentRootStore,
            id?: string
        ): DocumentRoot<Type> | undefined {
            if (!id) {
                return;
            }
            return this.documentRoots.find((d) => d.id === id) as DocumentRoot<Type> | undefined;
        },
        { keepAlive: true }
    );

    @action
    loadInNextBatch<Type extends DocumentType>(
        id: string,
        meta?: TypeMeta<Type>,
        loadConfig?: LoadConfig,
        accessConfig?: Partial<Config>
    ) {
        if (this.queued.has(id)) {
            return;
        }
        this.queued.set(id, {
            meta: meta,
            load: {
                documentRoot: true,
                documents: true,
                groupPermissions: true,
                userPermissions: true,
                skipCreate: false,
                ...(loadConfig || {})
            },
            access: accessConfig || {}
        });
        this.loadQueued();
        if (this.queued.size > 42) {
            // max 2048 characters in URL - flush if too many
            this.loadQueued.flush();
        }
    }

    /**
     * load the documentRoots only
     * - after 10 ms of "silence" (=no further load-requests during this period)
     * - or after 15ms have elapsed
     * - or when more then 42 records are queued (@see loadInNextBatch)
     *    (otherwise the URL maxlength would be reached)
     */
    loadQueued = _.debounce(action(this._loadQueued), 10, {
        leading: false,
        trailing: true,
        maxWait: 15
    });

    /**
     * loads all queued documentRoots. When a document root was not found,
     * it will be **created** (when the user is logged in).
     */
    @action
    _loadQueued() {
        const current = new Map([...this.queued]);
        this.queued.clear();
        /**
         * if the user is not logged in, we can't load the documents
         * so we just mark all queued documents as loaded
         */
        if (!this.root.sessionStore.isLoggedIn) {
            [...current.keys()].forEach((id) => {
                const dummyModel = this.find(id);
                if (dummyModel && dummyModel.isDummy) {
                    dummyModel.setLoaded();
                }
            });
            return;
        }
        const userId = this.root.userStore.viewedUserId;
        const isUserSwitched = this.root.userStore.isUserSwitched;
        /**
         * the user is not yet loaded, but a session is active
         */
        if (!userId) {
            for (const [id, meta] of current.entries()) {
                this.queued.set(id, meta);
            }
            this.loadQueued();
            return;
        }
        /**
         * load all queued documents
         */
        const keys = [...current.keys()].sort();
        this.withAbortController(`load-queued-${keys.join('--')}`, async (signal) => {
            const ignoreMissingRoots = isUserSwitched && keys.every((id) => this.find(id)?.isLoaded);
            const models = await apiFindManyFor(userId, keys, ignoreMissingRoots, signal.signal).catch(
                (e) => {
                    console.warn('Error loading document roots', e);
                    return { data: [] };
                }
            );
            // create all loaded models
            runInAction(() => {
                models.data.forEach((data) => {
                    const config = current.get(data.id);
                    if (!config) {
                        return;
                    }
                    this.addApiResultToStore(data, config);
                    current.delete(data.id);
                });
            });
            if (!isUserSwitched) {
                // create all missing root documents
                const created = await Promise.all(
                    [...current.keys()]
                        .filter((id) => !this.find(id)?.isLoaded && !current.get(id)!.load.skipCreate)
                        .map((id) => {
                            const config = current.get(id);
                            if (config && config.meta) {
                                return this.create(id, config.meta, config.access).catch(() => {
                                    // queue it up for loading later - the model was probably generated in the mean time?
                                    if (this.createAttempts.has(id)) {
                                        this.createAttempts.set(id, this.createAttempts.get(id)! + 1);
                                        if (this.createAttempts.get(id)! >= 5) {
                                            // prevent infinite loading cycle
                                            return undefined;
                                        }
                                    } else {
                                        this.createAttempts.set(id, 1);
                                    }
                                    this.loadInNextBatch(id, config.meta, config.load, config.access);
                                    return Promise.resolve({ id: id });
                                });
                            }
                            return Promise.resolve(undefined);
                        })
                );
                // delete all created roots from the current map
                created
                    .filter((docRoot) => !!docRoot)
                    .forEach((docRoot) => {
                        current.delete(docRoot.id);
                    });
            }
            // mark all remaining roots as loaded
            runInAction(() => {
                [...current.keys()].forEach((id) => {
                    const dummyModel = this.find(id);
                    if (dummyModel && dummyModel.isDummy) {
                        dummyModel.setLoaded();
                    }
                });
            });
        });
    }

    @action
    addApiResultToStore(data: ApiDocumentRoot, config: Omit<BatchedMeta, 'access'>) {
        if (!config.meta) {
            return;
        }
        const documentRoot = config.load.documentRoot
            ? new DocumentRoot(data, config.meta, this)
            : this.find(data.id);
        if (!documentRoot) {
            return;
        }
        if (config.load.documentRoot) {
            this.addDocumentRoot(documentRoot, { cleanup: true, deep: false });
        }
        if (config.load.groupPermissions) {
            data.groupPermissions.forEach((gp) => {
                this.root.permissionStore.addGroupPermission(
                    new GroupPermission({ ...gp, documentRootId: documentRoot.id }, this.root.permissionStore)
                );
            });
        }
        if (config.load.userPermissions) {
            data.userPermissions.forEach((up) => {
                this.root.permissionStore.addUserPermission(
                    new UserPermission({ ...up, documentRootId: documentRoot.id }, this.root.permissionStore)
                );
            });
        }
        if (config.load.documents) {
            data.documents.forEach((doc) => {
                this.root.documentStore.addToStore(doc);
            });
        }
        return documentRoot;
    }

    @action
    create<Type extends DocumentType>(id: string, meta: TypeMeta<Type>, config: Partial<Config>) {
        return this.withAbortController(`create-${id}`, async (signal) => {
            const { data } = await apiCreate(id, config, signal.signal);
            const docRoot = new DocumentRoot(data, meta, this);
            this.addDocumentRoot(docRoot, { cleanup: true, deep: false });
            return docRoot;
        });
    }

    @action
    handleUpdate({ id, access, sharedAccess }: DocumentRootUpdate) {
        const model = this.find(id);
        if (model && this.root.userStore.current) {
            const old = model.permission;
            let needsReload = false;
            if (access !== model.rootAccess) {
                model.setRootAccess(access);
                const current = model.permission;
                needsReload = NoneAccess.has(old) && !NoneAccess.has(current);
            }
            if (sharedAccess !== model.sharedAccess) {
                needsReload =
                    needsReload || (NoneAccess.has(model.sharedAccess) && !NoneAccess.has(sharedAccess));
                model.setSharedAccess(sharedAccess);
            }
            if (needsReload) {
                this.reload(model);
                console.log('reload model', model.id);
            }
        }
    }

    /**
     * returns userPermissions and! groupPermissions
     */
    usersPermissions(documentRootId: string, userId: string) {
        const user = this.root.userStore.findById(userId);
        return this._permissionsByUser(documentRootId, user);
    }

    /**
     * returns userPermissions and! groupPermissions
     */
    currentUsersPermissions(documentRootId: string) {
        const currentUser = this.root.userStore.current;
        return this._permissionsByUser(documentRootId, currentUser);
    }

    /**
     * returns userPermissions and! groupPermissions
     */
    private _permissionsByUser(documentRootId: string, user?: User) {
        if (!user) {
            return [];
        }
        return this.root.permissionStore
            .permissionsByDocumentRoot(documentRootId)
            .filter((p) => p.isAffectingUser(user));
    }

    @action
    removeFromStore(documentRootId: string, cleanup: boolean = true) {
        const docRoot = this.find(documentRootId);
        if (docRoot) {
            this.documentRoots.remove(docRoot);
            if (cleanup) {
                this.cleanupDocumentRoot(docRoot);
            }
        }
    }

    @action
    cleanupDocumentRoot(documentRoot: DocumentRoot<DocumentType>, cleanupDeep: boolean = true) {
        documentRoot.documents.forEach((doc) => {
            this.root.documentStore.removeFromStore(doc, cleanupDeep);
        });
    }

    @action
    reload(documentRoot: DocumentRoot<any>) {
        this.loadInNextBatch(documentRoot.id, documentRoot.meta, {
            documentRoot: true,
            documents: true,
            groupPermissions: true,
            userPermissions: true
        });
    }

    @action
    save(documentRoot: DocumentRoot<any>) {
        if (!this.root.sessionStore.isLoggedIn || !this.root.userStore.current?.hasElevatedAccess) {
            return Promise.resolve('error');
        }

        const model = {
            access: documentRoot.rootAccess,
            sharedAccess: documentRoot.sharedAccess
        };

        return this.withAbortController(`save-${documentRoot.id}`, (signal) => {
            return apiUpdate(documentRoot.id, model, signal.signal);
        }).catch(() => console.warn('Error saving document root'));
    }

    @action
    destroy(documentRoot: DocumentRoot<any>) {
        if (!this.root.sessionStore.isLoggedIn || !this.root.userStore.current?.hasElevatedAccess) {
            return Promise.reject('error');
        }
        return this.withAbortController(`destroy-${documentRoot.id}`, (signal) => {
            return apiDelete(documentRoot.id, signal.signal);
        })
            .then(() => {
                this.removeFromStore(documentRoot.id);
                return true;
            })
            .catch(() => {
                console.warn('Error destroying document root');
                return false;
            });
    }
}
