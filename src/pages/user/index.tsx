import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import Layout from '@theme/Layout';
import { observer } from 'mobx-react-lite';
import { Redirect } from '@docusaurus/router';
import { mdiArrowRightThin, mdiCircle, mdiDeleteEmptyOutline, mdiLogout, mdiRefresh } from '@mdi/js';
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
const { NO_AUTH } = siteConfig.customFields as { TEST_USERNAME?: string; NO_AUTH?: boolean };

const LeftAlign = (text: String) => {
    return text
        .split('\n')
        .map((line, index) => {
            return line.trim();
        })
        .join('\n');
};

const UserPage = observer(() => {
    const sessionStore = useStore('sessionStore');
    const userStore = useStore('userStore');
    const socketStore = useStore('socketStore');
    const groupStore = useStore('studentGroupStore');
    const isAuthenticated = useIsAuthenticated();
    const { inProgress } = useMsal();
    const { viewedUser, current } = userStore;
    if (
        !NO_AUTH &&
        ((sessionStore.currentUserId && !sessionStore.isLoggedIn) || inProgress !== InteractionStatus.None)
    ) {
        return <Loader />;
    }
    if (!NO_AUTH && !(sessionStore.isLoggedIn || isAuthenticated)) {
        return <Redirect to={'/login'} />;
    }
    return (
        <Layout>
            <main className={clsx(styles.main)}>
                <h2>User</h2>
                <DefinitionList>
                    <dt>Eingeloggt als</dt>
                    <dd>
                        {viewedUser?.firstName} {viewedUser?.lastName}
                    </dd>
                    <dt>Email</dt>
                    <dd>{viewedUser?.email}</dd>
                    <dt>Mit dem Server Verbunden?</dt>
                    <dd>
                        <Icon
                            path={mdiCircle}
                            size={0.7}
                            color={
                                socketStore.isLive ? 'var(--ifm-color-success)' : 'var(--ifm-color-danger)'
                            }
                        />{' '}
                        {socketStore.isLive ? 'Ja' : 'Nein'}
                    </dd>
                    {viewedUser && (
                        <>
                            <dt>Aktuell Online</dt>
                            <dd>
                                <span className={clsx(styles.connectedClients, 'badge', 'badge--primary')}>
                                    {socketStore.connectedClients.get(viewedUser.id)}
                                </span>
                            </dd>
                            <dt>In Gruppen</dt>
                            {groupStore.studentGroups.map((group) => {
                                return (
                                    <React.Fragment key={group.id}>
                                        <dt className={clsx(styles.studentGroup)}>{group.name}</dt>
                                        <dd>
                                            <span
                                                className={clsx(
                                                    styles.connectedClients,
                                                    'badge',
                                                    'badge--primary'
                                                )}
                                            >
                                                {socketStore.connectedClients.get(group.id)}
                                            </span>
                                        </dd>
                                    </React.Fragment>
                                );
                            })}
                        </>
                    )}
                </DefinitionList>
                {userStore.current?.isAdmin && (
                    <div>
                        <h2>User Tabelle</h2>
                        <div className={clsx(styles.userTable)}>
                            <UserTable
                                filterClassName={styles.filter}
                                defaultSortColumn="connectedClients"
                                defaultSortDirection="desc"
                                showAll
                            />
                        </div>
                    </div>
                )}
                <h2>Account</h2>
                <DefinitionList>
                    {current?.isAdmin && (
                        <>
                            <dt>Admin</dt>
                            <dd>
                                <Button
                                    href={'/teachers'}
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
                        Während der Schulzeit werden alle ausgefüllten Textfelder, Codeblocks und Checkboxes
                        auf einem Server der Schule gespeichert.
                    </dd>
                    <dd>
                        Am Ende der Schulzeit erhalten die Lernenden einen Datenexport ihrer Daten (so dass
                        die Webseite offline gebraucht werden kann). Zudem werden alle personenbezogenen Daten
                        vom Server gelöscht.
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
                </DefinitionList>
            </main>
        </Layout>
    );
});
export default UserPage;
