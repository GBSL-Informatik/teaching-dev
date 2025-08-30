import React from 'react';
import clsx from 'clsx';
import styles from '../AccessPanel.module.scss';
import { observer } from 'mobx-react-lite';
import DocumentRoot from '@tdev-models/DocumentRoot';
import { useStore } from '@tdev-hooks/useStore';
import UserPermission from '.';
import AccessSelector from '../AccessSelector';
import Loader from '@tdev-components/Loader';
import { Access } from '@tdev-api/document';
import _ from 'es-toolkit/compat';

interface Props {
    documentRoots: DocumentRoot<any>[];
}

const AccessPanel = observer((props: Props) => {
    const { documentRoots } = props;
    const userStore = useStore('userStore');
    const permissionStore = useStore('permissionStore');
    const [searchFilter, setSearchFilter] = React.useState('');
    const [searchRegex, setSearchRegex] = React.useState(new RegExp(searchFilter, 'i'));
    React.useEffect(() => {
        setSearchRegex(new RegExp(searchFilter, 'i'));
    }, [searchFilter]);
    if (documentRoots.length === 0) {
        return null;
    }
    if (documentRoots.some((dr) => dr.isDummy)) {
        return <div>-</div>;
    }
    const firstRoot = documentRoots[0];
    /** map that contains all present access levels */
    const activePermissionLevels = new Map<string, Set<Access>>();
    documentRoots.forEach((dr) => {
        dr.userPermissions.forEach((gp) => {
            if (!activePermissionLevels.has(gp.userId)) {
                activePermissionLevels.set(gp.userId, new Set());
            }
            activePermissionLevels.get(gp.userId)!.add(gp.access);
        });
    });

    const commonPermissions = firstRoot.userPermissions
        .map((up) => {
            return documentRoots
                .map((dr) => dr.userPermissions.find((up2) => up2.userId === up.userId))
                .filter((x) => !!x);
        })
        .filter((gps) => gps.length === documentRoots.length);
    return (
        <div className={clsx(styles.panel)}>
            <input
                type="text"
                placeholder="Suche..."
                value={searchFilter}
                className={clsx(styles.textInput)}
                onChange={(e) => {
                    setSearchFilter(e.target.value);
                }}
            />
            <div className={styles.listContainer}>
                <div className={clsx(styles.list)}>
                    {commonPermissions
                        .filter((permissions) =>
                            permissions[0].user?.searchTerm
                                ? searchRegex.test(permissions[0].user.searchTerm)
                                : true
                        )
                        .map((userPermissions, idx) => (
                            <div key={userPermissions[0].id} className={clsx(styles.item)}>
                                <UserPermission permissions={userPermissions} />
                            </div>
                        ))}
                    {userStore.managedUsers
                        .filter(
                            (user) =>
                                searchRegex.test(user.searchTerm) &&
                                !commonPermissions.some((p) => p[0].userId === user.id)
                        )
                        .map((user, idx) => (
                            <div key={idx} className={clsx(styles.item)}>
                                <span className={styles.audience}>{user.nameShort}</span>
                                <span className={clsx(styles.spacer)} />
                                <div className={styles.actions}>
                                    <AccessSelector
                                        accessTypes={[Access.RO_User, Access.RW_User, Access.None_User]}
                                        onChange={(access) => {
                                            documentRoots.forEach((dr) => {
                                                const currentPermission = dr.userPermissions.find(
                                                    (up) => up.userId === user.id
                                                );
                                                if (currentPermission) {
                                                    currentPermission.setAccess(access);
                                                } else {
                                                    permissionStore.createUserPermission(dr.id, user, access);
                                                }
                                            });
                                        }}
                                        mark={activePermissionLevels.get(user.id)}
                                    />
                                </div>
                            </div>
                        ))}
                </div>
            </div>
            {!documentRoots.every((dr) => permissionStore.permissionsLoadedForDocumentRootIds.has(dr.id)) && (
                <Loader overlay />
            )}
        </div>
    );
});

export default AccessPanel;
