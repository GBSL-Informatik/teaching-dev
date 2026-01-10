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
import { getOfflineUser } from '@tdev-api/OfflineApi';
const { OFFLINE_API, SENTRY_DSN } = siteConfig.customFields as {
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

const ExposeRootStoreToWindow = observer(() => {
    React.useEffect(() => {
        /**
         * Expose the store to the window object
         */
        (window as any).store = rootStore;
    }, [rootStore]);
    return null;
});

const Authentication = observer(() => {
    const { data: session } = authClient.useSession();
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

const OfflineApi = observer(() => {
    React.useEffect(() => {
        if (!OFFLINE_API) {
            return;
        }
        console.log('Using Offline API mode:', OFFLINE_API);
        const offlineUser = getOfflineUser();
        rootStore.load(offlineUser.id);
    }, []);
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

const LivenessChecker = observer(() => {
    const lastHiddenTimeRef = React.useRef<number | null>(null);
    React.useEffect(() => {
        const handleVisibilityChange = () => {
            if (!rootStore.sessionStore.isLoggedIn) {
                return;
            }
            if (document.hidden) {
                /**
                 * The Browser-Window is now hidden
                 * we could indicate to admins that the user has left the page
                 * (e.g. for exams)
                 */
                lastHiddenTimeRef.current = Date.now();
            } else {
                /**
                 * The Browser-Window is now visible again
                 */
                const elapsedSec = lastHiddenTimeRef.current
                    ? (Date.now() - lastHiddenTimeRef.current) / 1000
                    : 0;
                lastHiddenTimeRef.current = null;
                if (elapsedSec < 5) {
                    return;
                }
                authClient.getSession().then((res) => {
                    if (!res || res.error) {
                        window.location.reload();
                        return;
                    } else {
                        rootStore.socketStore?.checkLiveState();
                    }
                });
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [rootStore]);

    return null;
});

function Root({ children }: { children: React.ReactNode }) {
    const { siteConfig } = useDocusaurusContext();
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
                <ExposeRootStoreToWindow />
                {OFFLINE_API ? (
                    <OfflineApi />
                ) : (
                    <>
                        <Authentication />
                        <RemoteNavigationHandler />
                        <LoggedOutOverlay delayMs={5_000} stalledCheckIntervalMs={15_000} />
                        <LivenessChecker />
                    </>
                )}
                {SENTRY_DSN && <Sentry />}
                {children}
            </StoresProvider>
        </>
    );
}

export default Root;
