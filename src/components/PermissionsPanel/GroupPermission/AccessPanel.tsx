import React from 'react';
import clsx from 'clsx';
import styles from '../AccessPanel.module.scss';
import { observer } from 'mobx-react-lite';
import DocumentRoot from '@tdev-models/DocumentRoot';
import { useStore } from '@tdev-hooks/useStore';
import GroupPermission from '.';
import AccessSelector from '@tdev-components/PermissionsPanel/AccessSelector';
import Loader from '@tdev-components/Loader';
import { Access } from '@tdev-api/document';
import { default as GroupPermissionModel } from '@tdev-models/GroupPermission';
import _ from 'es-toolkit/compat';

interface Props {
    documentRoots: DocumentRoot<any>[];
}

const AccessPanel = observer((props: Props) => {
    const { documentRoots } = props;
    const studentGroupStore = useStore('studentGroupStore');
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
        dr.groupPermissions.forEach((gp) => {
            if (!activePermissionLevels.has(gp.groupId)) {
                activePermissionLevels.set(gp.groupId, new Set());
            }
            activePermissionLevels.get(gp.groupId)!.add(gp.access);
        });
    });

    const commonPermissions = firstRoot.groupPermissions
        .map((gp) => {
            return documentRoots
                .map((dr) => dr.groupPermissions.find((gp2) => gp2.groupId === gp.groupId))
                .filter((x) => !!x);
        })
        .filter((gps) => gps.length === documentRoots.length);
    return (
        <div>
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
                            permissions[0].group?.searchTerm
                                ? searchRegex.test(permissions[0].group.searchTerm)
                                : true
                        )
                        .map((groupPermissions, idx) => (
                            <div key={groupPermissions[0].id} className={clsx(styles.item)}>
                                <GroupPermission permissions={groupPermissions} />
                            </div>
                        ))}
                    {studentGroupStore.managedStudentGroups
                        .filter(
                            (group) =>
                                searchRegex.test(group.searchTerm) &&
                                !commonPermissions.some((p) => p[0].groupId === group.id)
                        )
                        .map((group, idx) => (
                            <div key={idx} className={clsx(styles.item)}>
                                <span className={clsx(styles.audience)}>{group.name}</span>
                                <span className={clsx(styles.spacer)} />
                                <div className={styles.actions}>
                                    <AccessSelector
                                        accessTypes={[
                                            Access.RO_StudentGroup,
                                            Access.RW_StudentGroup,
                                            Access.None_StudentGroup
                                        ]}
                                        onChange={(access) => {
                                            documentRoots.forEach((dr) => {
                                                const currentPermission = dr.groupPermissions.find(
                                                    (gp) => gp.groupId === group.id
                                                );
                                                if (currentPermission) {
                                                    currentPermission.setAccess(access);
                                                } else {
                                                    permissionStore.createGroupPermission(dr, group, access);
                                                }
                                            });
                                        }}
                                        mark={activePermissionLevels.get(group.id)}
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
