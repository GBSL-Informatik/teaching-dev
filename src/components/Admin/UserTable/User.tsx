import React from 'react';
import clsx from 'clsx';

import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import { default as UserModel } from '@tdev-models/User';
import CopyBadge from '@tdev-components/shared/CopyBadge';
import { formatDateTime } from '@tdev-models/helpers/date';
import { Role, RoleAccessLevel, RoleNames } from '@tdev-api/user';
import { useStore } from '@tdev-hooks/useStore';
import LiveStatusIndicator from '@tdev-components/LiveStatusIndicator';
import Icon from '@mdi/react';
import { mdiLink, mdiTrashCan } from '@mdi/js';
import { SIZE_S, SIZE_XS } from '@tdev-components/shared/iconSizes';
import { Confirm } from '@tdev-components/shared/Button/Confirm';
import { authClient } from '@tdev/auth-client';
import { action } from 'mobx';

interface Props {
    user: UserModel;
}

const UserTableRow = observer((props: Props) => {
    const { user } = props;
    const userStore = useStore('userStore');
    const { current } = userStore;
    if (!current) {
        return null;
    }
    return (
        <tr className={clsx(styles.user)}>
            <td>
                <div className={clsx(styles.clients)}>
                    <LiveStatusIndicator size={0.6} userId={user.id} />
                    {user.connectedClients > 0 && (
                        <span className={clsx('badge badge--primary')}>{user.connectedClients}</span>
                    )}
                </div>
            </td>
            <td>{user.email}</td>
            <td>
                <div className={clsx(styles.role, 'button-group')}>
                    {Object.values(Role).map((role, idx) => (
                        <button
                            key={idx}
                            className={clsx(
                                'button',
                                'button--sm',
                                role === user.role ? 'button--primary' : 'button--secondary'
                            )}
                            onClick={() => {
                                user.setRole(role);
                            }}
                            disabled={
                                user.id === current.id ||
                                current.accessLevel < RoleAccessLevel[role] ||
                                user.accessLevel > current.accessLevel
                            }
                        >
                            {RoleNames[role]}
                        </button>
                    ))}
                </div>
            </td>
            <td>{user.firstName}</td>
            <td>{user.lastName}</td>
            <td>{formatDateTime(user.createdAt)}</td>
            <td>{formatDateTime(user.updatedAt)}</td>
            <td>
                {user.studentGroups.map((group, idx) => (
                    <span className={clsx('badge badge--primary', styles.groupBadge)} key={idx}>
                        {group.name}
                    </span>
                ))}
            </td>
            <td>
                <CopyBadge value={user.id} className={clsx(styles.nowrap)} />
                <Confirm
                    icon={mdiTrashCan}
                    size={SIZE_XS}
                    onConfirm={() => {
                        authClient.admin.removeUser({ userId: user.id }).then(
                            action((res) => {
                                if (res.data?.success) {
                                    userStore.removeFromStore(user.id);
                                }
                            })
                        );
                    }}
                    color="red"
                    confirmText="Wirklich löschen?"
                    disabled={!current.isAdmin}
                />
            </td>
        </tr>
    );
});

export default UserTableRow;
