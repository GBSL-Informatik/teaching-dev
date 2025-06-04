import { action, observable } from 'mobx';
import iStore from './iStore';
import SignupToken from '@tdev-models/SignupToken';
import {
    create as apiCreate,
    all as apiAllSignupTokens,
    update as apiUpdateSignupToken,
    destroy as apiDeleteSignupToken
} from '@tdev-api/signupToken';
import { RootStore } from './rootStore';
import { computedFn } from 'mobx-utils';

export class SignupTokenStore extends iStore {
    readonly root: RootStore;
    signupTokens = observable<SignupToken>([]);

    constructor(root: RootStore) {
        super();
        this.root = root;
    }

    find = computedFn(
        function (this: SignupTokenStore, id?: string | null): SignupToken | undefined {
            if (!id) {
                return;
            }
            return this.signupTokens.find((d) => d.id === id);
        },
        { keepAlive: true }
    );

    @action
    load() {
        return this.withAbortController(`load-all`, async (ct) => {
            return apiAllSignupTokens(ct.signal).then(
                action((res) => {
                    const tokens = res.data.map((token) => new SignupToken(token, this));
                    this.signupTokens.replace(tokens);
                })
            );
        });
    }

    @action
    addToStore(token: SignupToken) {
        const old = this.find(token.id);
        if (old) {
            this.signupTokens.remove(old);
        }
        this.signupTokens.push(token);
    }

    @action
    removeFromStore(token?: SignupToken): SignupToken | undefined {
        /**
         * Removes the model to the store
         */
        if (token && this.signupTokens.remove(token)) {
            return token;
        }
    }

    @action
    create(
        method: string,
        description: string,
        validThrough: Date | null,
        maxUses: number,
        disabled: boolean
    ) {
        return this.withAbortController(`create-${name}`, async (signal) => {
            return apiCreate({ method, description, validThrough, maxUses, disabled }, signal.signal).then(
                action(({ data }) => {
                    const token = new SignupToken(data, this);
                    this.signupTokens.push(token);
                    return token;
                })
            );
        });
    }

    /*
    TODO:
    @action
    handleUpdate(data: ApiSignupToken) => steal from StudentGroupStore

    -> and add a case to SocketDataStore + make sure that the update comes with the rigth type (API?)
    */

    @action
    save(token: SignupToken) {
        return this.withAbortController(`save-${token.id}`, async (signal) => {
            return apiUpdateSignupToken(token.id, token.props, signal.signal).then(({ data }) => {
                const group = new SignupToken(data, this);
                this.addToStore(group);
                return group;
            });
        });
    }

    @action
    destroy(token: SignupToken) {
        return this.withAbortController(`destroy-${token.id}`, async (signal) => {
            return apiDeleteSignupToken(token.id, signal.signal).then(
                action(() => {
                    this.signupTokens.remove(token);
                })
            );
        });
    }
}
