import React from 'react';
import styles from './styles.module.scss';
import Button from '@tdev-components/shared/Button';
import { mdiCloudOffOutline, mdiIncognito, mdiLogin, mdiReload } from '@mdi/js';
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

const LoggedOutOverlay = observer(() => {
    const [closedByUser, setClosedByUser] = React.useState(false);
    const [showOverlay, setShowOverlay] = React.useState(false);
    const location = useLocation();
    const userStore = useStore('userStore');
    const socketStore = useStore('socketStore');

    React.useEffect(() => {
        const onLoginPage = location.pathname.startsWith('/login');
        setShowOverlay(!socketStore.isLive && !closedByUser && !onLoginPage);
    }, [socketStore.isLive, closedByUser, location]);

    return showOverlay ? (
        <div className={styles.container}>
            {userStore.current ? (
                <DisconnectedWarning onDismiss={() => setClosedByUser(true)} />
            ) : (
                <NotLoggedInWarning onDismiss={() => setClosedByUser(true)} />
            )}
        </div>
    ) : (
        <></>
    );
});

export default LoggedOutOverlay;
