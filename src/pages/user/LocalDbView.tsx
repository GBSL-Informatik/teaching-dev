import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import { mdiArrowRightThin } from '@mdi/js';
import { useStore } from '@tdev-hooks/useStore';
import Button from '@tdev-components/shared/Button';
import Loader from '@tdev-components/Loader';
import DefinitionList from '@tdev-components/DefinitionList';
import Icon from '@mdi/react';
import useIsBrowser from '@docusaurus/useIsBrowser';
import Badge from '@tdev-components/shared/Badge';
import { SIZE_M } from '@tdev-components/shared/iconSizes';
import CodeThemeToggle from '@tdev-components/util/CodeThemeToggle';
import { DEFAULT_OFFLINE_USER } from '@tdev-api/OfflineApi';
import customFields from '@tdev-components/util/customFields';
import DbImport from './DbActions/DbImport';
import DbExport from './DbActions/DbExport';
import DbDestroy from './DbActions/DbDestroy';
import { IfmColors } from '@tdev-components/shared/Colors';

const { OFFLINE_API, tdevConfig } = customFields;

const showDbActions = !(tdevConfig.database?.preventExport && tdevConfig.database.preventImport);

const API_MODES_DESCRIPTION: Record<string, string> = {
    indexedDB:
        'Alle Änderungen werden in einer lokalen Browserdatenbank gespeichert und verlassen den Computer nie. Beim Wechsel des Browsers oder des Laptops gehen die Daten verloren.',
    memory: 'Änderungen werden nur temporär gespeichert. Sobald die Seite neue geladen wird oder der Browser geschlossen wird, sind die Änderungen verloren.'
};

const LocalDbView = observer(() => {
    const isBrowser = useIsBrowser();
    const sessionStore = useStore('sessionStore');
    const userStore = useStore('userStore');
    const { viewedUser, current } = userStore;
    if (sessionStore.apiMode === 'api') {
        return null;
    }
    if (OFFLINE_API && !isBrowser) {
        return <Loader />;
    }

    return (
        <>
            <h2>User</h2>
            <DefinitionList className={clsx(styles.userInfo)}>
                {userStore.current?.id !== DEFAULT_OFFLINE_USER.id && (
                    <>
                        <dt>User</dt>
                        <dd>
                            {viewedUser?.firstName} {viewedUser?.lastName}
                        </dd>
                        <dt>Email</dt>
                        <dd>{viewedUser?.email}</dd>
                    </>
                )}
                {showDbActions && (
                    <>
                        <dt>Userdaten</dt>
                        <dd>
                            <DbImport />
                        </dd>
                        <dd>
                            <DbExport />
                        </dd>
                    </>
                )}
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
                            color={IfmColors.white}
                            className={clsx(styles.icon)}
                        />
                        {sessionStore.apiMode}
                    </Badge>
                </dd>
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
                {!tdevConfig.database?.preventDestroy && (
                    <>
                        <dt>Lokale Daten löschen</dt>
                        <dd>
                            <DbDestroy />
                        </dd>
                    </>
                )}
            </DefinitionList>
        </>
    );
});
export default LocalDbView;
