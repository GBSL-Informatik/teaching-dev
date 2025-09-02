import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import Layout from '@theme/Layout';
import { observer } from 'mobx-react-lite';
import { Redirect } from '@docusaurus/router';
import {
    mdiArrowRightThin,
    mdiBackupRestore,
    mdiCircle,
    mdiDeleteEmptyOutline,
    mdiHarddiskRemove,
    mdiLogout,
    mdiRefresh
} from '@mdi/js';
import { useMsal } from '@azure/msal-react';
import { useIsAuthenticated } from '@azure/msal-react';
import { InteractionStatus } from '@azure/msal-browser';
import siteConfig from '@generated/docusaurus.config';
import { useStore } from '@tdev-hooks/useStore';
import Button from '@tdev-components/shared/Button';
import Loader from '@tdev-components/Loader';
import DefinitionList from '@tdev-components/DefinitionList';
import Icon from '@mdi/react';
import UserTable from '@tdev-components/Admin/UserTable';
import NavReloadRequest from '@tdev-components/Admin/ActionRequest/NavReloadRequest';
import Storage from '@tdev-stores/utils/Storage';
import { logout } from '@tdev-api/user';
import SelectInput from '@tdev-components/shared/SelectInput';
import useIsBrowser from '@docusaurus/useIsBrowser';
import { useIsLive } from '@tdev-hooks/useIsLive';
import Badge from '@tdev-components/shared/Badge';
import { SIZE_M } from '@tdev-components/shared/iconSizes';
import { Confirm } from '@tdev-components/shared/Button/Confirm';
import api from '@tdev-api/base';

const { NO_AUTH, OFFLINE_API, TEST_USER } = siteConfig.customFields as {
    NO_AUTH?: boolean;
    OFFLINE_API?: boolean | 'memory' | 'indexedDB';
    TEST_USER?: string;
};

const API_MODES_DESCRIPTION: Record<string, string> = {
    api: 'Alle Änderungen werden auf einem Server gespeichert und sind von jedem Gerät aus zugänglich. Die Daten bleiben auch nach dem Schliessen des Browsers erhalten.',
    indexedDB:
        'Alle Änderungen werden in einer lokalen Browserdatenbank gespeichert und verlassen den Computer nie. Beim Wechsel des Browsers oder des Laptops gehen die Daten verloren.',
    memory: 'Änderungen werden nur temporär gespeichert. Sobald die Seite neue geladen wird oder der Browser geschlossen wird, sind die Änderungen verloren.'
};

const LeftAlign = (text: String) => {
    return text
        .split('\n')
        .map((line, index) => {
            return line.trim();
        })
        .join('\n');
};

const UserPage = observer(() => {
    const isBrowser = useIsBrowser();
    const sessionStore = useStore('sessionStore');
    const userStore = useStore('userStore');
    const socketStore = useStore('socketStore');
    const groupStore = useStore('studentGroupStore');
    const isAuthenticated = useIsAuthenticated();
    const { inProgress } = useMsal();
    const isLive = useIsLive();
    const { viewedUser, current } = userStore;
    if (OFFLINE_API && !isBrowser) {
        return <Loader />;
    }
    if (
        !NO_AUTH &&
        ((sessionStore.currentUserId && !sessionStore.isLoggedIn) || inProgress !== InteractionStatus.None)
    ) {
        return <Loader />;
    }
    if (!NO_AUTH && !(sessionStore.isLoggedIn || isAuthenticated)) {
        return <Redirect to={'/login'} />;
    }
    const connectedClients = socketStore.connectedClients.get(viewedUser?.id || ' ');

    const setTestUser = (username: string) => {
        sessionStore.setAccount({ username: username } as any);
        Storage.set('SessionStore', {
            user: { email: username }
        });
        logout(new AbortController().signal);
        window.location.reload();
    };

    return (
        <Layout>
            <main className={clsx(styles.main)}>
                <h2>User</h2>
                <DefinitionList className={clsx(styles.userInfo)}>
                    <dt>API-Modus</dt>
                    <dd>
                        <Badge
                            color="blue"
                            className={clsx(styles.badge)}
                            title={API_MODES_DESCRIPTION[sessionStore.apiMode]}
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
                    {sessionStore.apiMode === 'api' && (
                        <>
                            <dt>{userStore.isUserSwitched ? 'Ansicht für' : 'Eingeloggt als'}</dt>
                            <dd>
                                {viewedUser?.firstName} {viewedUser?.lastName}
                            </dd>
                            <dt>Email</dt>
                            <dd>{viewedUser?.email}</dd>
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
                                        <span
                                            className={clsx(
                                                styles.connectedClients,
                                                'badge',
                                                'badge--primary'
                                            )}
                                        >
                                            {userStore.isUserSwitched
                                                ? (connectedClients || 1) - 1
                                                : connectedClients}
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
                        </>
                    )}
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
                    {sessionStore.apiMode === 'api' && (
                        <>
                            <dt>Daten</dt>
                            <dd>
                                Während der Schulzeit werden alle ausgefüllten Textfelder, Codeblocks und
                                Checkboxes auf einem Server der Schule gespeichert.
                            </dd>
                            <dd>
                                Am Ende der Schulzeit erhalten die Lernenden einen Datenexport ihrer Daten (so
                                dass die Webseite offline gebraucht werden kann). Zudem werden alle
                                personenbezogenen Daten vom Server gelöscht.
                            </dd>
                            <dd>
                                Bei einem Klassenwechsel oder einem Austritt kann die Datenlöschung auch
                                vorgängig beantragt werden.
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
                            {NO_AUTH && (
                                <>
                                    <dt>Test-User wechseln</dt>
                                    <dd>
                                        <div className={clsx(styles.changeTestUser)}>
                                            <SelectInput
                                                options={userStore.users.map((user) => user.email)}
                                                onChange={(username) => setTestUser(username)}
                                                value={(sessionStore.account as any)?.username}
                                                disabled={userStore.users.length <= 1}
                                                placeholder={
                                                    TEST_USER || 'DEFAULT_TEST_USER nicht definiert in .env'
                                                }
                                            />
                                            {(sessionStore.account as any)?.username !==
                                                TEST_USER?.toLowerCase() && (
                                                <Button
                                                    icon={mdiBackupRestore}
                                                    color="primary"
                                                    title={`Zum Standard-Test-User wechseln`}
                                                    onClick={() => setTestUser(TEST_USER!)}
                                                />
                                            )}
                                        </div>
                                    </dd>
                                </>
                            )}
                            <dt>Ausloggen</dt>
                            <dd>
                                <Button
                                    onClick={() => sessionStore.logout()}
                                    text="Logout"
                                    title="User Abmelden"
                                    color="red"
                                    icon={mdiLogout}
                                    iconSide="left"
                                    noOutline
                                    className={clsx(styles.logout)}
                                />
                            </dd>
                            <dt>LocalStorage Löschen</dt>
                            <dd>
                                <Button
                                    text="Jetzt Löschen"
                                    icon={mdiRefresh}
                                    iconSide="left"
                                    onClick={() => {
                                        localStorage.clear();
                                        window.location.reload();
                                    }}
                                    color="orange"
                                />
                            </dd>
                        </>
                    )}
                    {sessionStore.apiMode !== 'api' && (
                        <>
                            <dt>IndexedDB Daten löschen</dt>
                            <dd>
                                <Confirm
                                    text="Jetzt Löschen"
                                    confirmText={
                                        sessionStore.apiMode === 'indexedDB'
                                            ? 'Wirklich alle gespeicherten Daten löschen?'
                                            : undefined
                                    }
                                    icon={mdiHarddiskRemove}
                                    iconSide="left"
                                    onConfirm={() => {
                                        api.destroyDb?.()
                                            .then(() => {
                                                console.log('IndexedDB Daten gelöscht');
                                                window.location.reload();
                                            })
                                            .catch((err) => {
                                                window.alert(
                                                    'Fehler beim Löschen der IndexedDB Daten: ' + err.message
                                                );
                                            });
                                    }}
                                    color="orange"
                                    confirmColor="red"
                                />
                            </dd>
                        </>
                    )}
                </DefinitionList>
            </main>
        </Layout>
    );
});
export default UserPage;
