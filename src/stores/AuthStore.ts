import { action, observable } from 'mobx';
import _ from 'es-toolkit/compat';
import type { RootStore } from './rootStore';
import { authClient } from '../auth-client';

export class AuthStore {
    readonly root: RootStore;
    @observable accessor authErrorMessage: string | null = null;
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
    setAuthErrorMessage(message: string | null) {
        this.authErrorMessage = message;
    }

    @action
    async signInWithEmail(email: string, password: string) {
        this.setAuthErrorMessage(null);
        const { data, error } = await authClient.signIn.email(
            {
                email: email.trim(),
                password: password.trim()
            },
            {
                onRequest: (ctx) => {
                    console.log('sign up request started', ctx);
                },
                onSuccess: (ctx) => {
                    console.log('sign up successful', ctx);
                    //redirect to the dashboard or sign in page
                },
                onError: action((ctx) => {
                    // display the error message
                    this.setAuthErrorMessage(ctx.error.message);
                    console.log('sign up failed', ctx.error.message);
                })
            }
        );
    }

    @action
    signOut() {
        this.root.socketStore.disconnect();
        return authClient.signOut();
    }
}
