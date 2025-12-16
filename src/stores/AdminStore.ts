import { action, observable } from 'mobx';
import { RootStore } from '@tdev-stores/rootStore';
import _ from 'es-toolkit/compat';
import iStore from '@tdev-stores/iStore';
import {
    AllowedAction,
    allowedActions as apiAllowedActions,
    deleteAllowedAction as apiDeleteAllowedAction,
    createAllowedAction as apiCreateAllowedAction,
    linkUserPassword,
    revokeUserPassword
} from '@tdev-api/admin';
import { DocumentType } from '@tdev-api/document';

export class AdminStore extends iStore<`set-user-pw-${string}` | `revoke-user-pw-${string}`> {
    readonly root: RootStore;
    allowedActions = observable<AllowedAction>([]);
    constructor(root: RootStore) {
        super();
        this.root = root;
    }

    @action
    load() {
        return this.withAbortController(`load-all`, async (ct) => {
            return apiAllowedActions(ct.signal).then(
                action((res) => {
                    this.allowedActions.replace(res.data);
                })
            );
        });
    }

    @action
    destroyAllowedAction(id: string) {
        const allowedAction = this.allowedActions.find((a) => a.id === id);
        if (allowedAction) {
            return this.withAbortController(`destroy-${id}`, async (ct) => {
                return apiDeleteAllowedAction(id, ct.signal).then(
                    action((res) => {
                        this.allowedActions.remove(allowedAction);
                    })
                );
            });
        }
        return Promise.resolve();
    }

    @action
    createAllowedAction(allowedAction: `update@${string}`, documentType: DocumentType) {
        return this.withAbortController(`create-new`, async (ct) => {
            return apiCreateAllowedAction({ action: allowedAction, documentType }, ct.signal).then(
                action((res) => {
                    this.allowedActions.push(res.data);
                })
            );
        });
    }

    @action
    setUserPassword(userId: string, newPassword: string) {
        if (!this.root.userStore.current?.isAdmin) {
            return Promise.reject(new Error('Not authorized'));
        }
        return this.withAbortController(`set-user-pw-${userId}`, async (ct) => {
            return linkUserPassword(userId, newPassword, ct.signal);
        });
    }

    @action
    revokeUserPassword(userId: string) {
        if (!this.root.userStore.current?.isAdmin) {
            return Promise.reject(new Error('Not authorized'));
        }
        return this.withAbortController(`revoke-user-pw-${userId}`, async (ct) => {
            return revokeUserPassword(userId, ct.signal);
        });
    }
}
