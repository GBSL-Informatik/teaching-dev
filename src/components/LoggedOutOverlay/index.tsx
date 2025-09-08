import React from 'react';
import styles from './styles.module.scss';
import Button from '@tdev-components/shared/Button';
import { mdiCloudOffOutline, mdiIncognito, mdiLogin, mdiReload, mdiSyncOff } from '@mdi/js';
import Admonition from '@theme/Admonition';
import { useLocation } from '@docusaurus/router';
import { useStore } from '@tdev-hooks/useStore';
import { observer } from 'mobx-react-lite';

interface WarningContentProps {
    onDismiss: () => void;
}

const Overlay = ({ children }: { children: React.ReactNode }) => {
    return (
        <div className={styles.container}>
            <div className={styles.content}>{children}</div>
        </div>
    );
};

const NotLoggedInWarning = ({ onDismiss }: WarningContentProps) => {
    return (
        <Overlay>
            <Admonition type="warning" title="Nicht eigenloggt">
                <p>
                    Sie sind nicht eingeloggt. Wenn Sie ohne Login fortfahren, wird Ihr{' '}
                    <b>Fortschritt nicht gespeichert</b>.
                </p>
            </Admonition>
            <div className={styles.buttons}>
                <Button icon={mdiLogin} color="primary" size={1.1} href={'/login'}>
                    Jetzt einloggen
                </Button>
                <Button icon={mdiIncognito} color="secondary" size={1.1} onClick={onDismiss}>
                    Weiter ohne Login
                </Button>
            </div>
        </Overlay>
    );
};

const DisconnectedWarning = ({ onDismiss }: WarningContentProps) => {
    return (
        <Overlay>
            <Admonition type="warning" title="Keine Verbindung zum Server">
                <p>
                    Es besteht keine Verbindung zum Server – <b>Ihr Fortschritt wird nicht gespeichert</b>.
                    Laden Sie die Seite neu, um die Verbindung wiederherzustellen.
                </p>
            </Admonition>
            <div className={styles.buttons}>
                <Button icon={mdiReload} color="primary" size={1.1} onClick={() => window.location.reload()}>
                    Seite neu laden
                </Button>
                <Button icon={mdiCloudOffOutline} color="secondary" size={1.1} onClick={onDismiss}>
                    Offline verwenden
                </Button>
            </div>
        </Overlay>
    );
};

const StalledWarning = ({ onDismiss }: WarningContentProps) => {
    return (
        <Overlay>
            <Admonition type="warning" title="Keine Verbindung zum Server">
                <p>
                    Einige Dokumente wurden nicht korrekt geladen –{' '}
                    <b>Änderungen werden nicht zuverlässig gespeichert</b>. Laden Sie die Seite neu, um die
                    Dokumente erneut zu laden.
                </p>
            </Admonition>
            <div className={styles.buttons}>
                <Button icon={mdiReload} color="primary" size={1.1} onClick={() => window.location.reload()}>
                    Seite neu laden
                </Button>
                <Button icon={mdiSyncOff} color="secondary" size={1.1} onClick={onDismiss}>
                    Ignorieren
                </Button>
            </div>
        </Overlay>
    );
};

interface Props {
    delayMs?: number;
    // intervall to check for stalled document roots
    stalledCheckIntervalMs?: number;
}

const LoggedOutOverlay = observer((props: Props) => {
    const [isVisible, setIsVisible] = React.useState<boolean>(false);
    const [delayExpired, setDelayExpired] = React.useState((props.delayMs ?? 0) > 0 ? false : true);
    const [ignoredIssues, setIgnoredIssues] = React.useState<Set<'offline' | 'not-logged-in' | 'stalled'>>(
        new Set()
    );
    const [syncIssue, setSyncIssue] = React.useState<null | 'offline' | 'stalled'>(null);
    const location = useLocation();
    const userStore = useStore('userStore');
    const documentRootStore = useStore('documentRootStore');
    const socketStore = useStore('socketStore');

    React.useEffect(() => {
        const onVisibilityChange = () => {
            setIsVisible(document.visibilityState === 'visible');
            setSyncIssue(null);
            setDelayExpired(false);
        };
        document.addEventListener('visibilitychange', onVisibilityChange);
        onVisibilityChange();
        return () => {
            document.removeEventListener('visibilitychange', onVisibilityChange);
        };
    }, []);

    React.useEffect(() => {
        if (props.delayMs && isVisible) {
            const timeout = setTimeout(() => {
                setDelayExpired(true);
            }, props.delayMs);
            return () => clearTimeout(timeout);
        }
    }, [props.delayMs, isVisible]);

    React.useEffect(() => {
        if (props.stalledCheckIntervalMs && isVisible) {
            const interval = setInterval(() => {
                const now = Date.now();
                // Check for stalled document roots
                const stalled = documentRootStore.documentRoots.filter(
                    (dr) => dr.isLoadable && dr.isDummy && now - dr.initializedAt > 5000
                );
                if (stalled.length > 0) {
                    setSyncIssue((r) => r ?? 'stalled');
                }
            }, props.stalledCheckIntervalMs);
            return () => clearInterval(interval);
        }
    }, [props.stalledCheckIntervalMs, documentRootStore, isVisible]);

    React.useEffect(() => {
        const onLoginPage = location.pathname.startsWith('/login');
        if (socketStore.isLive || onLoginPage || !isVisible) {
            return;
        }
        // check back in 5 seconds, whether the connection is restored
        const timeout = setTimeout(() => {
            setSyncIssue((current) => current ?? 'offline');
        }, 5_000);
        // when "isLive" becomes true in the meantime, the timeout should be cleared
        return () => clearTimeout(timeout);
    }, [socketStore.isLive, ignoredIssues, location, isVisible]);

    if (!isVisible) {
        return null;
    }

    if (!delayExpired || !syncIssue || ignoredIssues.has(syncIssue) || ignoredIssues.has('not-logged-in')) {
        return null;
    }
    if (!userStore.current) {
        return (
            <NotLoggedInWarning
                onDismiss={() => {
                    setIgnoredIssues((s) => new Set([...s, 'not-logged-in']));
                    setSyncIssue(null);
                }}
            />
        );
    }
    switch (syncIssue) {
        case 'offline':
            return (
                <DisconnectedWarning
                    onDismiss={() => {
                        setIgnoredIssues((s) => new Set([...s, 'offline']));
                        setSyncIssue(null);
                    }}
                />
            );
        case 'stalled':
            return (
                <StalledWarning
                    onDismiss={() => {
                        setIgnoredIssues((s) => new Set([...s, 'stalled']));
                        setSyncIssue(null);
                    }}
                />
            );
    }
    return null;
});

export default LoggedOutOverlay;
