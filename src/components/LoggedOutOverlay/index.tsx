import React from 'react';
import styles from './styles.module.scss';
import Button from '@tdev-components/shared/Button';
import { mdiIncognito, mdiLogin } from '@mdi/js';
import Admonition from '@theme/Admonition';
import { useLocation } from '@docusaurus/router';
import { useStore } from '@tdev-hooks/useStore';
import { observer } from 'mobx-react-lite';

const LoggedOutOverlay = observer(() => {
    const [closedByUser, setClosedByUser] = React.useState(false);
    const [showOverlay, setShowOverlay] = React.useState(false);
    const location = useLocation();
    const userStore = useStore('userStore');
    const socketStore = useStore('socketStore');

    React.useEffect(() => {
        const userLoggedIn = !!userStore.current;
        //const userConnected = socketStore.connectedClients.get(userStore.current?.id ?? '') || 0 > 0;
        const onLoginPage = location.pathname.startsWith('/login');
        console.log({ userConnected: userLoggedIn, onLoginPage, closedByUser });
        setShowOverlay(!userLoggedIn && !closedByUser && !onLoginPage);
    }, [userStore.current, socketStore.connectedClients, closedByUser, location]);

    return showOverlay ? (
        <div className={styles.container}>
            <div className={styles.content}>
                <Admonition type="warning" title="Nicht eigenloggt">
                    <p>
                        Sie sind nicht eingeloggt. Sie können diese Plattform auch ohne Login nutzen,
                        allerdings wird Ihr <b>Fortschritt nicht gespeichert</b>.
                    </p>
                </Admonition>
                <div className={styles.buttons}>
                    <Button
                        icon={mdiLogin}
                        color="primary"
                        size={1.1}
                        href={'/login'}
                        onClick={() => setClosedByUser(true)}
                    >
                        Jetzt einloggen
                    </Button>
                    <Button
                        icon={mdiIncognito}
                        color="secondary"
                        size={1.1}
                        onClick={() => setClosedByUser(true)}
                    >
                        Weiter ohne Login
                    </Button>
                </div>
            </div>
        </div>
    ) : (
        <></>
    );
});

export default LoggedOutOverlay;
