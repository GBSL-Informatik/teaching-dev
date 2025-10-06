import React from 'react';
import { StoresProvider, rootStore } from '@tdev-stores/rootStore';
import { observer } from 'mobx-react-lite';
import Head from '@docusaurus/Head';
import siteConfig from '@generated/docusaurus.config';
import { useStore } from '@tdev-hooks/useStore';
import { reaction } from 'mobx';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import { useHistory } from '@docusaurus/router';
import LoggedOutOverlay from '@tdev-components/LoggedOutOverlay';
import { authClient } from '@tdev/auth-client';
const { NO_AUTH, OFFLINE_API, TEST_USER, SENTRY_DSN } = siteConfig.customFields as {
    TEST_USER?: string;
    NO_AUTH?: boolean;
    SENTRY_DSN?: string;
    OFFLINE_API?: boolean | 'memory' | 'indexedDB';
};

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

const Authentication = observer(() => {
    const { data: session } = authClient.useSession();
    React.useEffect(() => {
        (window as any).store = rootStore;
    }, [rootStore]);
    React.useEffect(() => {
        if (!rootStore) {
            return;
        }
        if (session?.user) {
            rootStore.load(session.user.id);
        } else {
            rootStore.cleanup();
        }
    }, [session?.user, rootStore]);
    return null;
});

const Sentry = observer(() => {
    React.useEffect(() => {
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
    return null;
});

function Root({ children }: { children: React.ReactNode }) {
    React.useEffect(() => {
        if (!rootStore) {
            return;
        }
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
        let timeoutId: ReturnType<typeof setTimeout>;
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
                timeoutId = setTimeout(() => {
                    rootStore.socketStore.reconnect();
                }, 3000);
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            clearTimeout(timeoutId);
        };
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
                {!OFFLINE_API && (
                    <>
                        <Authentication />
                        <RemoteNavigationHandler />
                        <LoggedOutOverlay delayMs={5_000} stalledCheckIntervalMs={15_000} />
                    </>
                )}
                {SENTRY_DSN && <Sentry />}
                {children}
            </StoresProvider>
        </>
    );
}

export default Root;
