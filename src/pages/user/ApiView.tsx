import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import Layout from '@theme/Layout';
import { observer } from 'mobx-react-lite';
import { Redirect } from '@docusaurus/router';
import { mdiArrowRightThin, mdiCircle, mdiCloudQuestion, mdiDeleteEmptyOutline, mdiLogout } from '@mdi/js';
import { useStore } from '@tdev-hooks/useStore';
import Button from '@tdev-components/shared/Button';
import Loader from '@tdev-components/Loader';
import DefinitionList from '@tdev-components/DefinitionList';
import Icon from '@mdi/react';
import NavReloadRequest from '@tdev-components/Admin/ActionRequest/NavReloadRequest';
import { AuthProviderColor, AuthProviderIcons } from '@tdev-api/user';
import { useIsLive } from '@tdev-hooks/useIsLive';
import Badge from '@tdev-components/shared/Badge';
import { SIZE_M, SIZE_XS } from '@tdev-components/shared/iconSizes';
import { authClient } from '@tdev/auth-client';
import CodeThemeToggle from '@tdev-components/utils/CodeThemeToggle';
import customFields from '@tdev-components/utils/customFields';

const { OFFLINE_API } = customFields;

const LeftAlign = (text: String) => {
    return text
        .split('\n')
        .map((line, index) => {
            return line.trim();
        })
        .join('\n');
};

const ApiView = observer(() => {
    const sessionStore = useStore('sessionStore');
    const authStore = useStore('authStore');
    const userStore = useStore('userStore');
    const socketStore = useStore('socketStore');
    const groupStore = useStore('studentGroupStore');
    const { data: session } = authClient.useSession();
    const isLive = useIsLive();
    const { viewedUser, current } = userStore;
    if (OFFLINE_API || sessionStore.apiMode !== 'api') {
        return null;
    }
    if (sessionStore.currentUserId && !session?.user) {
        return <Loader />;
    }
    if (!session?.user) {
        return <Redirect to={'/login'} />;
    }
    const connectedClients = socketStore.connectedClients.get(viewedUser?.id || ' ');

    return (
        <>
            <h2>User</h2>
            <DefinitionList className={clsx(styles.userInfo)}>
                <dt>API-Modus</dt>
                <dd>
                    <Badge
                        color="blue"
                        className={clsx(styles.badge)}
                        title="Alle Änderungen werden auf einem Server gespeichert und sind von jedem Gerät aus zugänglich. Die Daten bleiben auch nach dem Schliessen des Browsers erhalten."
                    >
                        <Icon
                            path={sessionStore.apiModeIcon}
                            size={SIZE_M}
                            color={'var(--ifm-color-white'}
                            className={clsx(styles.icon)}
                        />
                        {sessionStore.apiMode}
                    </Badge>
                </dd>
                <dt>{userStore.isUserSwitched ? 'Ansicht für' : 'Eingeloggt als'}</dt>
                <dd>
                    {viewedUser?.firstName} {viewedUser?.lastName}
                </dd>
                <dt>Email</dt>
                <dd>{viewedUser?.email}</dd>
                <dt>Anmelden über</dt>
                <dd>
                    {viewedUser?.authProviders?.map((auth, idx) => (
                        <Icon
                            path={AuthProviderIcons[auth] || mdiCloudQuestion}
                            size={SIZE_XS}
                            color={AuthProviderColor[auth]}
                            key={idx}
                            title={auth}
                        />
                    ))}
                </dd>
                <dt>Ist mein Gerät mit dem Server Verbunden?</dt>
                <dd>
                    <Icon
                        path={mdiCircle}
                        size={0.7}
                        color={isLive ? 'var(--ifm-color-success)' : 'var(--ifm-color-danger)'}
                    />{' '}
                    {isLive ? 'Ja' : 'Nein'}
                </dd>
                {viewedUser && (
                    <>
                        <dt>Aktuell Online</dt>
                        <dd>
                            <span className={clsx(styles.connectedClients, 'badge', 'badge--primary')}>
                                {userStore.isUserSwitched ? (connectedClients || 1) - 1 : connectedClients}
                            </span>
                        </dd>
                    </>
                )}
                {viewedUser && !userStore.isUserSwitched && (
                    <>
                        <dt>In Gruppen</dt>
                        {groupStore.studentGroups.map((group) => {
                            return (
                                <React.Fragment key={group.id}>
                                    <dt className={clsx(styles.studentGroup)}>{group.name}</dt>
                                    <dd className={clsx(styles.reloadAction)}>
                                        <span
                                            className={clsx(
                                                styles.connectedClients,
                                                'badge',
                                                'badge--primary'
                                            )}
                                        >
                                            {socketStore.connectedClients.get(group.id)}
                                        </span>
                                        <NavReloadRequest roomIds={[group.id]} />
                                    </dd>
                                </React.Fragment>
                            );
                        })}
                    </>
                )}
            </DefinitionList>
            <h2>Account</h2>
            <DefinitionList>
                <dt>Code Theme</dt>
                <dd>
                    <CodeThemeToggle showText />
                </dd>
                {current?.hasElevatedAccess && (
                    <>
                        <dt>Admin</dt>
                        <dd>
                            <Button
                                href={'/admin'}
                                text="zum Adminbereich"
                                icon={mdiArrowRightThin}
                                iconSide="left"
                                color="primary"
                            />
                        </dd>
                    </>
                )}
                <dt>Daten</dt>
                <dd>
                    Während der Schulzeit werden alle ausgefüllten Textfelder, Codeblocks und Checkboxes auf
                    einem Server der Schule gespeichert.
                </dd>
                <dd>
                    Am Ende der Schulzeit erhalten die Lernenden einen Datenexport ihrer Daten (so dass die
                    Webseite offline gebraucht werden kann). Zudem werden alle personenbezogenen Daten vom
                    Server gelöscht.
                </dd>
                <dd>
                    Bei einem Klassenwechsel oder einem Austritt kann die Datenlöschung auch vorgängig
                    beantragt werden.
                </dd>
                <dt>Datenlöschung</dt>
                <dd>Alle personenbezogenen Daten löschen (Konto, Übungen, Notizen,...).</dd>
                <dd>
                    <Button
                        href={LeftAlign(`mailto:teachers.name@school.ch?subject=[${window.location.hostname}]: Datenlöschung für ${viewedUser?.email}&body=Guten Tag%0D%0A%0D%0A
                                    Hiermit beantrage ich die vollständige und unwiderrufliche Löschung meiner Daten der Webseite ${window.location.hostname}.%0D%0A%0D%0A
                                    
                                    E-Mail: ${viewedUser?.email}%0D%0A
                                    Account-ID: ${viewedUser?.id}%0D%0A%0D%0A
                                    
                                    Bitte bestätigen Sie die Löschung meiner Daten.%0D%0A%0D%0A
                                    
                                    Freundliche Grüsse,%0D%0A
                                    ${viewedUser?.firstName} ${viewedUser?.lastName} &cc=${viewedUser?.email}`)}
                        text="Jetzt Beantragen"
                        icon={mdiDeleteEmptyOutline}
                        iconSide="left"
                    />
                </dd>
                <dt>Ausloggen</dt>
                <dd>
                    <Button
                        onClick={() => {
                            authStore.signOut().then(() => {
                                window.location.reload();
                            });
                        }}
                        text="Logout"
                        title="User Abmelden"
                        color="red"
                        icon={mdiLogout}
                        iconSide="left"
                        noOutline
                        className={clsx(styles.logout)}
                    />
                </dd>
            </DefinitionList>
        </>
    );
});
export default ApiView;
