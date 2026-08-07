import { action, observable } from 'mobx';
import _ from 'es-toolkit/compat';
import type { RootStore } from './rootStore';
import { authClient } from '../auth-client';
import customFields from '@tdev-components/utils/customFields';
const { APP_URL } = customFields;

export class AuthStore {
    readonly root: RootStore;
    @observable accessor authErrorMessage: string | null = null;
    @observable accessor isAuthenticating: null | 'email' | 'microsoft' | 'github' = null;
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
    setIsAuthenticating(isAuthenticating: null | 'email' | 'microsoft' | 'github') {
        this.isAuthenticating = isAuthenticating;
    }

    @action
    resetAuthState() {
        this.setAuthErrorMessage(null);
        this.setIsAuthenticating(null);
    }

    @action
    signInWithEmail(email: string, password: string) {
        this.resetAuthState();
        return authClient.signIn
            .email(
                {
                    email: email.trim(),
                    password: password.trim()
                },
                {
                    onRequest: action((ctx) => {
                        this.setIsAuthenticating('email');
                    }),
                    onError: action((ctx) => {
                        this.setAuthErrorMessage(ctx.error.message);
                    })
                }
            )
            .catch((err) => {
                this.setAuthErrorMessage(err.message);
                console.log('sign in with github failed', err.message);
            })
            .finally(
                action(() => {
                    this.setIsAuthenticating(null);
                })
            );
    }

    @action
    socialSignIn(provider: 'microsoft' | 'github') {
        this.resetAuthState();
        return authClient.signIn
            .social(
                {
                    provider: provider,
                    callbackURL: APP_URL
                },
                {
                    onRequest: action((ctx) => {
                        this.setIsAuthenticating(provider);
                    }),
                    onError: action((ctx) => {
                        this.setAuthErrorMessage(ctx.error.message);
                    })
                }
            )
            .catch((err) => {
                this.setAuthErrorMessage(err.message);
            })
            .finally(
                action(() => {
                    this.setIsAuthenticating(null);
                })
            );
    }

    @action
    signOut() {
        this.root.socketStore.disconnect();
        return authClient.signOut();
    }
}
