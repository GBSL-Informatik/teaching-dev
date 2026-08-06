import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import { useStore } from '@tdev-hooks/useStore';
import Button from '@tdev-components/shared/Button';
import Badge from '@tdev-components/shared/Badge';
import Link from '@docusaurus/Link';
import CopyBadge from '@tdev-components/shared/CopyBadge';
import { reaction } from 'mobx';
import AccessBadge, { AccessIcon } from '@tdev-components/PermissionsPanel/AccessBadge';
import Icon from '@mdi/react';
import { SIZE_S, SIZE_XS } from '@tdev-components/shared/iconSizes';
import {
    mdiAccount,
    mdiAccountCancel,
    mdiAccountGroup,
    mdiAccountMultipleRemove,
    mdiAccountRemove,
    mdiSync,
    mdiSyncCircle
} from '@mdi/js';
import { ApiState } from '@tdev-stores/iStore';
import Card from '@tdev-components/shared/Card';
import { Confirm } from '@tdev-components/shared/Button/Confirm';

interface Props {}

const PermissionsControl = observer((props: Props) => {
    const docRootStore = useStore('documentRootStore');
    const permissionStore = useStore('permissionStore');
    const viewStore = useStore('viewStore');
    const view = viewStore.permissionControl;

    React.useEffect(() => {
        const loadDocRoots = (ids: string[]) => {
            permissionStore.loadAllPermissions(ids).catch((err) => {
                console.error('Error loading permissions:', err);
            });
        };
        loadDocRoots(view.relevantDocumentRootIds);
        const dispose = reaction(
            () => view.relevantDocumentRootIds,
            (relevantDocumentRootIds) => {
                loadDocRoots(relevantDocumentRootIds);
            }
        );
        return () => {
            dispose();
        };
    }, []);

    return (
        <div className={clsx(styles.adminPermission)}>
            <Card header={<h3>Filter</h3>} classNames={{ card: clsx(styles.actions) }}>
                <div className={clsx(styles.typeFilter, 'button-group', 'button-group--block')}>
                    {view.documentTypes.map((docType, idx) => (
                        <Button
                            className={clsx(styles.docTypeButton)}
                            onClick={() => {
                                view.toggleTypeFilter(docType);
                            }}
                            text={docType}
                            noOutline={view.typeFilter.has(docType)}
                            color={view.typeFilter.has(docType) ? view.typeColors.get(docType) : 'secondary'}
                            key={idx}
                        />
                    ))}
                </div>
                <Button
                    icon={mdiSync}
                    color="orange"
                    noOutline
                    onClick={() => {
                        permissionStore
                            .loadAllPermissions(view.relevantDocumentRootIds, true)
                            .catch((err) => {
                                console.error('Error loading permissions:', err);
                            });
                    }}
                    text="Berechtigungen neu laden"
                    spin={permissionStore.apiStateFor('load-all-permissions') === ApiState.SYNCING}
                />
            </Card>
            <Card header={<h3>Berechtigungen</h3>} classNames={{ card: clsx(styles.docsTree) }}>
                <ul>
                    {Object.entries(view.docsTree).map(([path, docs]) => (
                        <li key={path}>
                            <strong>
                                <Link to={path}>{path}</Link>
                            </strong>
                            <div className={clsx(styles.docActions)}>
                                {docs.some((doc) => docRootStore.find(doc.id)?.userPermissions?.length) && (
                                    <Confirm
                                        icon={mdiAccountRemove}
                                        iconSide="left"
                                        text="User"
                                        confirmText="Userberechtigungen entfernen?"
                                        title="Alle Benutzerberechtigungen entfernen"
                                        color="red"
                                        onConfirm={() => {
                                            docs.forEach((doc) => {
                                                const root = docRootStore.find(doc.id);
                                                if (root) {
                                                    root.userPermissions.forEach((userPermission) => {
                                                        permissionStore.deleteUserPermission(userPermission);
                                                    });
                                                    // root.groupPermissions.forEach((groupPermission) => {
                                                    //     permissionStore.deleteGroupPermission(groupPermission);
                                                    // });
                                                }
                                            });
                                        }}
                                    />
                                )}
                                {docs.some((doc) => docRootStore.find(doc.id)?.groupPermissions?.length) && (
                                    <Confirm
                                        icon={mdiAccountMultipleRemove}
                                        iconSide="left"
                                        text="Gruppe"
                                        title="Alle Gruppenberechtigungen entfernen"
                                        confirmText="Gruppenberechtigungen entfernen?"
                                        color="red"
                                        onConfirm={() => {
                                            docs.forEach((doc) => {
                                                const root = docRootStore.find(doc.id);
                                                if (root) {
                                                    root.groupPermissions.forEach((groupPermission) => {
                                                        permissionStore.deleteGroupPermission(
                                                            groupPermission
                                                        );
                                                    });
                                                }
                                            });
                                        }}
                                    />
                                )}
                            </div>
                            <ul>
                                {docs.map((doc) => {
                                    const root = docRootStore.find(doc.id);
                                    return (
                                        <li key={doc.id}>
                                            <Badge color={view.typeColors.get(doc.type)}>{doc.type}</Badge> -{' '}
                                            <CopyBadge
                                                label={`DocumentRootId: ${doc.id.slice(0, 8)}...`}
                                                value={doc.id}
                                            />
                                            <Badge type="primary">
                                                Allgemein{' '}
                                                <Icon path={AccessIcon(root?._access)} size={SIZE_XS} />
                                            </Badge>
                                            <Badge type="secondary">
                                                Shared{' '}
                                                <Icon path={AccessIcon(root?._sharedAccess)} size={SIZE_XS} />
                                            </Badge>
                                            <Badge color={root?.groupPermissions?.length ? 'orange' : 'gray'}>
                                                <Icon path={mdiAccountGroup} size={SIZE_XS} />{' '}
                                                {root?.groupPermissions?.length}
                                            </Badge>
                                            <Badge color={root?.userPermissions?.length ? 'orange' : 'gray'}>
                                                <Icon path={mdiAccount} size={SIZE_XS} />{' '}
                                                {root?.userPermissions?.length}
                                            </Badge>
                                        </li>
                                    );
                                })}
                            </ul>
                        </li>
                    ))}
                </ul>
            </Card>
        </div>
    );
});

export default PermissionsControl;
