import { action } from 'mobx';
import _ from 'es-toolkit/compat';
import type { RootStore } from './rootStore';
import { authClient } from '../auth-client';

export class AuthStore {
    readonly root: RootStore;
    constructor(root: RootStore) {
        this.root = root;
    }

    @action
    createUser(email: string, password: string, firstName: string, lastName: string) {
        return authClient.admin.createUser({
            email,
            password,
            name: `${firstName} ${lastName}`,
            data: {
                firstName,
                lastName
            }
        });
    }

    @action
    async signInWithEmail(email: string, password: string) {
        const { data, error } = await authClient.signIn.email(
            {
                email,
                password
            },
            {
                onRequest: (ctx) => {
                    console.log('sign up request started', ctx);
                },
                onSuccess: (ctx) => {
                    console.log('sign up successful', ctx);
                    //redirect to the dashboard or sign in page
                },
                onError: (ctx) => {
                    // display the error message
                    console.log('sign up failed', ctx.error.message);
                }
            }
        );
    }

    @action
    signOut() {
        this.root.socketStore.disconnect();
        return authClient.signOut();
    }
}
