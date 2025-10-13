import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import { useStore } from '@tdev-hooks/useStore';
import { Confirm } from '@tdev-components/shared/Button/Confirm';
import { mdiLoading, mdiReloadAlert, mdiWebRefresh } from '@mdi/js';

interface Props {
    roomIds?: string[];
    userIds?: string[];
    slim?: boolean;
}

const NavReloadRequest = observer((props: Props) => {
    const userStore = useStore('userStore');
    const studentGroupStore = useStore('studentGroupStore');
    const socketStore = useStore('socketStore');
    const [isLoading, setIsLoading] = React.useState(false);
    if (!userStore.current?.hasElevatedAccess) {
        return null;
    }
    const roomIds = new Set<string>(props.roomIds || []);
    const userIds = new Set<string>(props.userIds || []);
    if (
        !studentGroupStore.managedStudentGroups.some((group) => roomIds.has(group.id)) &&
        !userStore.managedUsers.some((user) => userIds.has(user.id))
    ) {
        return null;
    }

    return (
        <Confirm
            text={props.slim ? undefined : 'Neu laden'}
            title="Clients neu laden"
            confirmText={props.slim ? 'Sicher?' : 'Clients neu laden?'}
            icon={isLoading ? mdiLoading : mdiWebRefresh}
            iconSide="left"
            confirmIcon={mdiReloadAlert}
            color="primary"
            spin={isLoading}
            onConfirm={() => {
                setIsLoading(true);
                socketStore.requestReload(props.roomIds || [], props.userIds || []).finally(() => {
                    setIsLoading(false);
                });
            }}
        />
    );
});

export default NavReloadRequest;
