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

const NotLoggedInWarning = ({ onDismiss }: WarningContentProps) => {
    return (
        <div className={styles.content}>
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
        </div>
    );
};

const DisconnectedWarning = ({ onDismiss }: WarningContentProps) => {
    return (
        <div className={styles.content}>
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
        </div>
    );
};

const StalledWarning = ({ onDismiss }: WarningContentProps) => {
    return (
        <div className={styles.content}>
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
        </div>
    );
};

interface Props {
    delayMs?: number;
    // intervall to check for stalled document roots
    stalledCheckIntervalMs?: number;
}

const LoggedOutOverlay = observer((props: Props) => {
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
        if (props.delayMs) {
            const timeout = setTimeout(() => {
                setDelayExpired(true);
            }, props.delayMs);
            return () => clearTimeout(timeout);
        }
    }, [props.delayMs]);

    React.useEffect(() => {
        if (props.stalledCheckIntervalMs) {
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
    }, [props.stalledCheckIntervalMs, documentRootStore]);

    React.useEffect(() => {
        const onLoginPage = location.pathname.startsWith('/login');
        if (socketStore.isLive || onLoginPage) {
            return;
        }
        setSyncIssue((current) => current ?? 'offline');
    }, [socketStore.isLive, ignoredIssues, location]);

    if (!delayExpired || !syncIssue || ignoredIssues.has(syncIssue)) {
        return null;
    }
    if (!userStore.current && !ignoredIssues.has('not-logged-in')) {
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
