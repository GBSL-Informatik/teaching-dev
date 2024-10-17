import clsx from 'clsx';
import Layout from '@theme/Layout';

import { matchPath, useLocation } from '@docusaurus/router';
import BrowserOnly from '@docusaurus/BrowserOnly';
import { observer } from 'mobx-react-lite';
import Loader from '@tdev-components/Loader';
import Icon from '@mdi/react';
import { mdiAccountAlert, mdiEmoticonSad } from '@mdi/js';
import { useStore } from '@tdev-hooks/useStore';
import styles from './styles.module.scss';
import React from 'react';
import Conversation from '../Text/Conversation';
import NewMessage from '../Text/NewMessage';

interface Props {
    path: string;
}

const NoRoom = () => {
    return (
        <div className={clsx('alert alert--warning', styles.alert)} role="alert">
            <Icon path={mdiEmoticonSad} size={1} color="var(--ifm-color-warning)" />
            Kein Raum ausgewählt!
        </div>
    );
};

const NoUser = () => {
    return (
        <div className={clsx('alert alert--danger', styles.alert)} role="alert">
            <Icon path={mdiAccountAlert} size={1} color="var(--ifm-color-danger)" />
            Nicht angemeldet
        </div>
    );
};

const Rooms = observer((props: Props): JSX.Element => {
    const userStore = useStore('userStore');
    const userMessageStore = useStore('userMessageStore');
    const routeParams = matchPath(props.path, '/rooms/:room');
    const room = ((routeParams?.params as { room: string }) || {}).room;
    React.useEffect(() => {
        if (userStore.current && room && userMessageStore.canJoinRooms) {
            userMessageStore.joinRoom(room);
            return () => {
                userMessageStore.leaveRoom(room);
            };
        }
    }, [room, userStore.current, userMessageStore.canJoinRooms]);

    if (!userStore.current) {
        return <NoUser />;
    }
    if (!room) {
        return <NoRoom />;
    }
    return (
        <>
            <div className={clsx(styles.wrapper)}>
                <div className={clsx(styles.rooms)}>
                    <h1>{room}</h1>
                    <Conversation room={room} />
                    <NewMessage room={room} />
                </div>
            </div>
        </>
    );
});

const RoomsLandingPage = observer(() => {
    const location = useLocation();
    return (
        <Layout title={`Räume`} description="Nachrichtenräume">
            <BrowserOnly fallback={<Loader />}>{() => <Rooms path={location.pathname} />}</BrowserOnly>
        </Layout>
    );
});

export default RoomsLandingPage;
