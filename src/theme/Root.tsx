import React from 'react';
import { MsalProvider, useIsAuthenticated, useMsal } from '@azure/msal-react';
import { StoresProvider, rootStore } from '@tdev-stores/rootStore';
import { observer } from 'mobx-react-lite';
import { TENANT_ID, msalConfig } from '@tdev/authConfig';
import Head from '@docusaurus/Head';
import siteConfig from '@generated/docusaurus.config';
import { AccountInfo, EventType, InteractionStatus, PublicClientApplication } from '@azure/msal-browser';
import { setupMsalAxios, setupNoAuthAxios } from '@tdev-api/base';
import { useStore } from '@tdev-hooks/useStore';
import { reaction, runInAction } from 'mobx';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import scheduleMicrotask from '@tdev-components/util/scheduleMicrotask';
import { useHistory } from '@docusaurus/router';
import Storage from '@tdev-stores/utils/Storage';
import { noAuthMessage, offlineApiMessage } from './Root.helpers';
const { NO_AUTH, OFFLINE_API, TEST_USER, SENTRY_DSN } = siteConfig.customFields as {
    TEST_USER?: string;
    NO_AUTH?: boolean;
    SENTRY_DSN?: string;
    OFFLINE_API?: boolean | 'memory' | 'indexDb';
};
export const msalInstance = new PublicClientApplication(msalConfig);

const currentTestUsername = Storage.get('SessionStore', {
    user: { email: TEST_USER }
})?.user?.email?.toLowerCase();

if (NO_AUTH) {
    if (OFFLINE_API) {
        console.log(offlineApiMessage(OFFLINE_API ?? 'memory'));
    } else {
        console.log(noAuthMessage(currentTestUsername));
    }
}

const MsalWrapper = observer(({ children }: { children: React.ReactNode }) => {
    const sessionStore = useStore('sessionStore');
    React.useEffect(() => {
        if (NO_AUTH && process.env.NODE_ENV !== 'production' && currentTestUsername) {
            setupNoAuthAxios(currentTestUsername);
        }
    }, []);
    React.useEffect(() => {
        if (OFFLINE_API) {
            return rootStore.load();
        }
        /**
         * DEV MODE
         * - no auth
         */
        if (NO_AUTH && !sessionStore?.isLoggedIn && currentTestUsername) {
            runInAction(() => {
                sessionStore.authMethod = 'msal';
            });

            scheduleMicrotask(() => {
                rootStore.sessionStore.setAccount({
                    username: currentTestUsername
                } as any);
            });

            rootStore.load();
            return;
        }

        if (!sessionStore?.initialized) {
            return;
        }
        /**
         * PROD MODE
         * - auth over cookie
         */
        if (sessionStore.authMethod === 'apiKey') {
            return;
        }

        /**
         * PROD MODE
         * - auth over msal
         */
        msalInstance.initialize().then(() => {
            if (!msalInstance.getActiveAccount() && msalInstance.getAllAccounts().length > 0) {
                // Account selection logic is app dependent. Adjust as needed for different use cases.
                const account = msalInstance
                    .getAllAccounts()
                    .filter((a) => a.tenantId === TENANT_ID)
                    .find((a) => /@(edu\.)?(gbsl|gbjb)\.ch/.test(a.username));
                if (account) {
                    msalInstance.setActiveAccount(account);
                }
            }
            msalInstance.enableAccountStorageEvents();
            msalInstance.addEventCallback((event) => {
                if (
                    event.eventType === EventType.LOGIN_SUCCESS &&
                    (event.payload as { account: AccountInfo }).account
                ) {
                    const account = (event.payload as { account: AccountInfo }).account;
                    msalInstance.setActiveAccount(account);
                }
            });
        });
    }, [msalInstance, sessionStore?.authMethod]);

    React.useEffect(() => {
        if (NO_AUTH) {
            /**
             * TODO: load the authorized entities, if needed
             */
        }
    }, [NO_AUTH, rootStore]);

    if (NO_AUTH || OFFLINE_API) {
        return children;
    }
    return (
        <MsalProvider instance={msalInstance}>
            <MsalAccount />
            {children}
        </MsalProvider>
    );
});

const MsalAccount = observer(() => {
    const { accounts, inProgress, instance } = useMsal();
    const isAuthenticated = useIsAuthenticated();
    const sessionStore = useStore('sessionStore');

    React.useEffect(() => {
        if (sessionStore.authMethod === 'apiKey' && !NO_AUTH) {
            return;
        }
        if (isAuthenticated && inProgress === InteractionStatus.None) {
            const active = instance.getActiveAccount();
            if (active) {
                /**
                 * order matters
                 * 1. setup axios with the correct tokens
                 * 2. set the msal instance and account to the session store
                 * 3. load authorized entities
                 */
                setupMsalAxios();
                scheduleMicrotask(() => {
                    rootStore.sessionStore.setAccount(active);
                    rootStore.load();
                });
            }
        }
    }, [sessionStore?.authMethod, accounts, inProgress, instance, isAuthenticated]);
    return (
        <div
            data--isauthenticated={isAuthenticated}
            data--account={instance.getActiveAccount()?.username}
        ></div>
    );
});

const RemoteNavigationHandler = observer(() => {
    const socketStore = useStore('socketStore');
    const history = useHistory();
    React.useEffect(() => {
        if (socketStore) {
            const disposer = reaction(
                () => socketStore.actionRequest,
                (navRequest) => {
                    if (!navRequest) {
                        return;
                    }
                    switch (navRequest.type) {
                        case 'nav-reload':
                            window.location.reload();
                            break;
                        case 'nav-target':
                            if (navRequest.target) {
                                history.push(navRequest.target);
                            }
                            break;
                    }
                }
            );
            return disposer;
        }
    }, [socketStore, history]);
    return null;
});

// Default implementation, that you can customize
function Root({ children }: { children: React.ReactNode }) {
    React.useEffect(() => {
        if (!rootStore) {
            return;
        }
        rootStore.sessionStore.setupStorageSync();
        if (window) {
            if ((window as any).store && (window as any).store !== rootStore) {
                try {
                    (window as any).store.cleanup();
                } catch (e) {
                    console.error('Failed to cleanup the store', e);
                }
            }
            (window as any).store = rootStore;
        }
        return () => {
            /**
             * TODO: cleanup the store
             * - remove all listeners
             * - clear all data
             * - disconnect all sockets
             */
            // rootStore?.cleanup();
        };
    }, [rootStore]);

    const { siteConfig } = useDocusaurusContext();
    React.useEffect(() => {
        /**
         * Expose the store to the window object
         */
        (window as any).store = rootStore;
    }, [rootStore]);
    React.useEffect(() => {
        // load sentry
        if (!SENTRY_DSN) {
            return;
        }
        import('@sentry/react')
            .then((Sentry) => {
                if (Sentry) {
                    Sentry.init({
                        dsn: SENTRY_DSN
                        // integrations: [Sentry.browserTracingIntegration()],
                        // tracesSampleRate: 1.0, //  Capture 100% of the transactions
                        // tracePropagationTargets: ['localhost', /^https:\/\/yourserver\.io\/api/]
                    });
                }
            })
            .catch(() => {
                console.error('Sentry failed to load');
            });
    }, [SENTRY_DSN]);

    React.useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden) {
                /**
                 * eventuall we could disconnect the socket
                 * or at least indicate to admins that the user has left the page (e.g. for exams)
                 */
                // rootStore.socketStore.disconnect();
            } else {
                /**
                 * make sure to reconnect the socket when the user returns to the page
                 * The delay is added to avoid reconnecting too quickly
                 */
                const timeoutId = setTimeout(() => {
                    if (rootStore.socketStore.isLive && rootStore.socketStore.socket?.disconnected) {
                        rootStore.socketStore.reconnect();
                    } else {
                        rootStore.socketStore.connect();
                    }
                }, 3000);
                return () => clearTimeout(timeoutId);
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [rootStore]);

    return (
        <>
            <Head>
                <meta property="og:description" content={siteConfig.tagline} />
                <meta
                    property="og:image"
                    content={`${siteConfig.customFields?.DOMAIN || ''}/img/og-preview.jpeg`}
                />
            </Head>
            <StoresProvider value={rootStore}>
                <MsalWrapper>{children}</MsalWrapper>
                <RemoteNavigationHandler />
            </StoresProvider>
        </>
    );
}

export default Root;
