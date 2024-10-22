import React from 'react';
import Popup from 'reactjs-popup';
import styles from './styles.module.scss';
import Button from '@tdev-components/shared/Button';
import { mdiShieldLockOutline } from '@mdi/js';
import DocumentRoot from '@tdev-models/DocumentRoot';
import { observer } from 'mobx-react-lite';
import { Access } from '@tdev-api/document';
import { useStore } from '@tdev-hooks/useStore';
import clsx from 'clsx';
import AccessSelector from './AccessSelector';
import { default as UserAccessPanel } from './UserPermission/AccessPanel';
import { default as GroupAccessPanel } from './GroupPermission/AccessPanel';
import DefinitionList from '../DefinitionList';
import { action } from 'mobx';
import UserPermission from '@tdev-components/PermissionsPanel/UserPermission';

interface Props {
    documentRootId: string;
}

interface AccessRadioButtonProps {
    targetAccess: Access;
    accessProp: 'rootAccess' | 'sharedAccess';
    documentRoot: DocumentRoot<any>;
}

const PermissionsPanel = observer(({ documentRootId }: Props) => {
    const userStore = useStore('userStore');
    const documentRootStore = useStore('documentRootStore');
    const permissionStore = useStore('permissionStore');
    const documentRoot = documentRootStore.find(documentRootId);
    const { viewedUser } = userStore;

    if (!userStore.current?.isAdmin || !documentRoot) {
        return null;
    }

    if (viewedUser && viewedUser !== userStore.current) {
        const userPermission = permissionStore
            .userPermissionsByDocumentRoot(documentRoot.id)
            .find((permission) => permission.userId === viewedUser.id);
        return (
            <div className={styles.viewedUserPermissionPanel} onClick={(e) => e.stopPropagation()}>
                {userPermission ? (
                    <UserPermission permission={userPermission} />
                ) : (
                    <AccessSelector
                        accessTypes={[Access.RO_User, Access.RW_User, Access.None_User]}
                        onChange={(access) => {
                            permissionStore.createUserPermission(documentRoot, viewedUser, access);
                        }}
                    />
                )}
            </div>
        );
    }

    return (
        <Popup
            trigger={
                <span>
                    <Button
                        onClick={(e) => {
                            e.preventDefault();
                        }}
                        icon={mdiShieldLockOutline}
                        color="secondary"
                    />
                </span>
            }
            on="click"
            closeOnDocumentClick
            closeOnEscape
            onOpen={action(() => {
                permissionStore.loadPermissions(documentRoot);
            })}
        >
            <div className={clsx(styles.wrapper, 'card')}>
                <div className={clsx('card__header', styles.header)}>
                    <h3>Berechtigungen Festlegen</h3>
                </div>
                <div className={clsx('card__body', styles.cardBody)}>
                    <DefinitionList className={styles.popupContentContainer} small>
                        <dt>Allgemeine Berechtigung</dt>
                        <dd>
                            <AccessSelector
                                accessTypes={[
                                    Access.RO_DocumentRoot,
                                    Access.RW_DocumentRoot,
                                    Access.None_DocumentRoot
                                ]}
                                access={documentRoot.rootAccess}
                                onChange={(access) => {
                                    documentRoot.rootAccess = access;
                                    documentRoot.save();
                                }}
                            />
                        </dd>
                        <dt>Für geteilte Dokumente (default: None)</dt>
                        <dd>
                            <AccessSelector
                                accessTypes={[
                                    Access.RO_DocumentRoot,
                                    Access.RW_DocumentRoot,
                                    Access.None_DocumentRoot
                                ]}
                                access={documentRoot.sharedAccess}
                                onChange={(access) => {
                                    documentRoot.sharedAccess = access;
                                    documentRoot.save();
                                }}
                            />
                        </dd>
                        <dt>Gruppen-Berechtigungen</dt>
                        <dd>
                            <GroupAccessPanel documentRoot={documentRoot} />
                        </dd>
                        <dt>User-Berechtigungen</dt>
                        <dd>
                            <UserAccessPanel documentRoot={documentRoot} />
                        </dd>
                    </DefinitionList>
                </div>
            </div>
        </Popup>
    );
});

export default PermissionsPanel;
