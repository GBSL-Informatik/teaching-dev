import React from 'react';
import clsx from 'clsx';

import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import {
    mdiAccountCircleOutline,
    mdiAccountSwitch,
    mdiCircle,
    mdiHomeAccount,
    mdiShieldAccount
} from '@mdi/js';
import { useStore } from '@tdev-hooks/useStore';
import Button from '@tdev-components/shared/Button';
import useIsBrowser from '@docusaurus/useIsBrowser';
import Popup from 'reactjs-popup';
import _ from 'lodash';
import { useLocation } from '@docusaurus/router';
import Icon from '@mdi/react';
import User from '@tdev-models/User';

interface SwitchToUserButtonProps {
    user: User;
    isInCurrentClass?: boolean;
}

const SwitchToUserButton = observer(({ user, isInCurrentClass }: SwitchToUserButtonProps) => {
    const userStore = useStore('userStore');
    const socketStore = useStore('socketStore');

    return (
        <div className={clsx(styles.switchToUserButton)}>
            <Icon
                path={mdiCircle}
                size={0.3}
                color={
                    (
                        userStore.isUserSwitched && userStore.viewedUser?.id == user.id
                            ? (socketStore.connectedClients.get(user.id) || 0) >= 2
                            : (socketStore.connectedClients.get(user.id) || 0) >= 1
                    )
                        ? 'var(--ifm-color-success)'
                        : 'var(--ifm-color-danger)'
                }
                className={clsx(styles.liveIndicator)}
            />
            <Button
                icon={user.isStudent ? mdiAccountCircleOutline : mdiShieldAccount}
                size={0.8}
                className={clsx(styles.userButton)}
                iconSide="left"
                active={userStore.viewedUserId === user.id}
                color={isInCurrentClass ? 'primary' : 'secondary'}
                title={`Inhalte anzeigen für ${user.firstName} ${user.lastName}`}
                onClick={() => userStore.switchUser(user.id)}
            >
                {user.nameShort}
            </Button>
        </div>
    );
});

const AccountSwitcher = observer(() => {
    const isBrowser = useIsBrowser();
    const userStore = useStore('userStore');
    const sessionStore = useStore('sessionStore');
    const location = useLocation();

    if (!isBrowser || !userStore.current?.hasElevatedAccess || sessionStore.apiMode !== 'api') {
        return null;
    }
    const klass = location.pathname.split('/')[1];
    return (
        <>
            {userStore.isUserSwitched && (
                <div className={styles.accountSwitcher}>
                    <Button
                        icon={mdiHomeAccount}
                        size={0.8}
                        className={clsx(styles.accountSwitcherButton)}
                        iconSide="left"
                        color="primary"
                        title={`Zurück zu ${userStore.current?.nameShort}`}
                        onClick={() => userStore.switchUser(undefined)}
                    />
                </div>
            )}
            <Popup
                trigger={
                    <div className={styles.accountSwitcher}>
                        <Button
                            icon={mdiAccountSwitch}
                            size={0.8}
                            className={clsx(styles.accountSwitcherButton)}
                            iconSide="left"
                            color="primary"
                            title="Anderen Account Anzeigen"
                        />
                    </div>
                }
                on={['click', 'hover']}
                closeOnDocumentClick
                closeOnEscape
            >
                <div className={clsx(styles.wrapper, 'card')}>
                    <div className={clsx('card__header', styles.header)}>
                        <h4>User wechseln</h4>
                    </div>
                    <div className={clsx('card__body', styles.body)}>
                        <div className={styles.userList}>
                            {_.orderBy(
                                userStore.managedUsers.filter((u) =>
                                    u.studentGroups.some((g) => g.name === klass)
                                ),
                                ['firstName']
                            ).map((user) => (
                                <SwitchToUserButton key={user.id} user={user} isInCurrentClass={true} />
                            ))}
                            {_.orderBy(
                                userStore.managedUsers.filter(
                                    (g) => !g.studentGroups.some((g) => g.name === klass)
                                ),
                                ['firstName']
                            ).map((user) => (
                                <SwitchToUserButton key={user.id} user={user} isInCurrentClass={false} />
                            ))}
                        </div>
                    </div>
                </div>
            </Popup>
        </>
    );
});

export default AccountSwitcher;
