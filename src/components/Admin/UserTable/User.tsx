import React from 'react';
import clsx from 'clsx';

import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import { default as UserModel } from '@tdev-models/User';
import CopyBadge from '@tdev-components/shared/CopyBadge';
import { formatDateTime } from '@tdev-models/helpers/date';
import { AuthProviderColor, AuthProviderIcons, RoleColors, RoleNames } from '@tdev-api/user';
import { useStore } from '@tdev-hooks/useStore';
import LiveStatusIndicator from '@tdev-components/LiveStatusIndicator';
import Icon from '@mdi/react';
import { mdiAccountCancel, mdiAccountEdit, mdiCloudQuestion } from '@mdi/js';
import { SIZE_S, SIZE_XS } from '@tdev-components/shared/iconSizes';
import Button from '@tdev-components/shared/Button';
import Popup from 'reactjs-popup';
import EditUser from '../EditUser';
import { PopupActions } from 'reactjs-popup/dist/types';
import Badge from '@tdev-components/shared/Badge';
import NavReloadRequest from '../ActionRequest/NavReloadRequest';
import { IfmColors } from '@tdev-components/shared/Colors';
import ExportModal from '../ExportPanel/ExportModal';
import Card from '@tdev-components/shared/Card';
import DefinitionList from '@tdev-components/DefinitionList';

interface Props {
    user: UserModel;
}

const UserTableRow = observer((props: Props) => {
    const { user } = props;
    const userStore = useStore('userStore');
    const { current } = userStore;
    const ref = React.useRef<PopupActions>(null);
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
                    {user.banned && <Icon path={mdiAccountCancel} size={SIZE_XS} color={IfmColors.red} />}
                </div>
            </td>
            <td>{user.email}</td>
            <td>
                <Badge color={RoleColors[user.role]}>{RoleNames[user.role]}</Badge>
            </td>
            <td>
                <div className={clsx(styles.flex)}>
                    <Popup
                        trigger={
                            <span>
                                <Button icon={mdiAccountEdit} size={SIZE_S} color="orange" />
                            </span>
                        }
                        modal
                        ref={ref}
                        overlayStyle={{ background: 'rgba(0,0,0,0.5)' }}
                        on={'click'}
                    >
                        <EditUser user={user} close={() => ref.current?.close()} />
                    </Popup>
                    <ExportModal
                        userIds={[user.id]}
                        name={user.firstName + ' ' + user.lastName}
                        fileName={`${user.email.split('@')[0].replace('.', '_')}_${new Date().toISOString().slice(0, 10)}.json`}
                        title={`Exportiere Daten von ${user.firstName} ${user.lastName}`}
                    />
                    {user.connectedClients > 0 && <NavReloadRequest userIds={[user.id]} slim />}
                </div>
            </td>
            <td>{user.firstName}</td>
            <td>{user.lastName}</td>
            <td>
                {user.authProviders.map((u, idx) => (
                    <Icon
                        path={AuthProviderIcons[u] || mdiCloudQuestion}
                        size={SIZE_XS}
                        color={AuthProviderColor[u]}
                        key={idx}
                        title={u}
                    />
                ))}
            </td>
            <td>{formatDateTime(user.createdAt, true)}</td>
            <td>{formatDateTime(user.updatedAt, true)}</td>
            <td>
                {user.lastSeen ? (
                    <Popup
                        trigger={
                            <span>
                                <Badge>{formatDateTime(user.lastSeen, true)}</Badge>
                            </span>
                        }
                        on="hover"
                        position={['top left', 'left center']}
                        keepTooltipInside="#__docusaurus"
                        mouseEnterDelay={200}
                        repositionOnResize
                    >
                        <Card>
                            <DefinitionList small>
                                <dt>Expires</dt>
                                <dd>{formatDateTime(user.lastSession!.expiresAt, true)}</dd>
                                <dt>IP</dt>
                                <dd>{user.lastSession?.ipAddress ?? '-'}</dd>
                                <dt>Client</dt>
                                <dd>
                                    <pre>
                                        <code>
                                            {(user.lastSession?.userAgent ?? '-').split(') ').join(')\n')}
                                        </code>
                                    </pre>
                                </dd>
                            </DefinitionList>
                        </Card>
                    </Popup>
                ) : null}
            </td>
            <td className={clsx(styles.limitWidth)}>
                {user.studentGroups.map((group, idx) => (
                    <span className={clsx('badge badge--primary', styles.groupBadge)} key={idx}>
                        {group.name}
                    </span>
                ))}
            </td>
            <td>
                <CopyBadge
                    value={user.id}
                    label={`${user.id.slice(0, 20)}...`}
                    className={clsx(styles.nowrap)}
                />
            </td>
        </tr>
    );
});

export default UserTableRow;
