import { action, computed, observable } from 'mobx';
import { User as UserProps, all as apiAll, currentUser, update as apiUpdate } from '@tdev-api/user';
import { RootStore } from '@tdev-stores/rootStore';
import User from '@tdev-models/User';
import _ from 'lodash';
import Storage, { PersistedData } from '@tdev-stores/utils/Storage';
import { computedFn } from 'mobx-utils';
import iStore from '@tdev-stores/iStore';
import scheduleMicrotask from '@tdev-components/util/scheduleMicrotask';

export class UserStore extends iStore<`update-${string}`> {
    readonly root: RootStore;

    @observable accessor _viewedUserId: string | undefined = undefined;
    users = observable<User>([]);

    constructor(root: RootStore) {
        super();
        this.root = root;

        scheduleMicrotask(() => {
            // attempt to load the previous state of this store from localstorage
            this.rehydrate();
        });
    }

    @action
    rehydrate(_data?: PersistedData) {
        if (this.users.length > 0) {
            return;
        }
        const data = Storage.get('SessionStore', _data);
        if (data?.user) {
            try {
                this.addToStore(data.user);
            } catch (e) {
                console.error(e);
                Storage.remove('SessionStore');
            }
        }
    }

    find = computedFn(
        function <T>(this: UserStore, id?: string): User | undefined {
            if (!id) {
                return;
            }
            return this.users.find((d) => d.id === id) as User;
        },
        { keepAlive: true }
    );

    createModel(data: UserProps): User {
        return new User(data, this);
    }

    @action
    addToStore(data: UserProps) {
        if (!data) {
            return;
        }
        const newUser = this.createModel(data);
        this.removeFromStore(newUser.id);
        this.users.push(newUser);
        return newUser;
    }

    @action
    removeFromStore(id: string): User | undefined {
        /**
         * Removes the model to the store
         */
        const old = this.find(id);
        if (old) {
            this.users.remove(old);
            /**
             * eventually cleanup the model
             */
        }
        return old;
    }

    @computed
    get current(): User | undefined {
        if (this.root.sessionStore?.authMethod === 'msal') {
            return this.users.find(
                (u) => u.email?.toLowerCase() === this.root?.sessionStore?.account?.username?.toLowerCase()
            );
        }
        return this.users.find((u) => u.id === this.root.sessionStore?.currentUserId);
    }

    findById(id: string) {
        return this.users.find((user) => user.id === id);
    }

    @computed
    get viewedUserId() {
        if (!this.current?.isAdmin) {
            return this.current?.id;
        }
        return this._viewedUserId || this.current?.id || this.root.sessionStore.userId;
    }

    @computed
    get isUserSwitched() {
        return !!this._viewedUserId;
    }

    @action
    switchUser(userId: string | undefined) {
        if (!this.current?.isAdmin || this._viewedUserId === userId) {
            return;
        }
        /**
         * side-effect: if there are unprocessed rootDocuments in the queue, ensure they are processed
         *
         */
        if (this.root.documentRootStore.queued.size > 0) {
            this.root.documentRootStore.loadQueued.flush();
        }
        if (this._viewedUserId) {
            this.root.socketStore.leaveRoom(this._viewedUserId);
        }
        if (userId === this.current?.id) {
            this._viewedUserId = undefined;
            return;
        }
        this._viewedUserId = userId;
        if (userId) {
            this.root.socketStore.joinRoom(userId);
        }
    }

    @computed
    get viewedUser(): User | undefined {
        return this.find(this.viewedUserId);
    }

    @action
    load() {
        return this.withAbortController(`load-all`, async (ct) => {
            return apiAll(ct.signal).then(
                action((res) => {
                    const models = res.data.map((d) => this.createModel(d));
                    this.users.replace(models);
                })
            );
        });
    }

    @action
    loadCurrent() {
        const res = this.withAbortController('load-user', async (signal) => {
            return currentUser(signal.signal).then((res) => {
                const currentUser = this.addToStore(res.data);
                if (currentUser) {
                    Storage.set('SessionStore', {
                        user: { ...currentUser.props, isAdmin: false }
                    });
                }
                return currentUser;
            });
        }).catch(
            action((e) => {
                if (this.root.sessionStore.authMethod === 'apiKey') {
                    this.root.sessionStore.setMsalStrategy();
                }
            })
        );
        return res;
    }

    @action
    update(user: User) {
        return this.withAbortController(`update-${user.id}`, async (ct) => {
            return apiUpdate(user.id, user.props, ct.signal).then(
                action((res) => {
                    this.addToStore(res.data);
                })
            );
        });
    }

    @action
    cleanup() {
        this.users.clear();
    }
}
