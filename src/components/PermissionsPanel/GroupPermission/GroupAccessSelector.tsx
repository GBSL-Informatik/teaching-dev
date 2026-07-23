import React from 'react';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import { useStore } from '@tdev-hooks/useStore';
import AccessSelector from '../AccessSelector';
import { Access } from '@tdev-api/document';
import StudentGroup from '@tdev-models/StudentGroup';

interface Props {
    group: StudentGroup;
    mark?: Set<Access>;
    className?: string;
}

const GroupAccessSelector = observer((props: Props) => {
    const { group } = props;
    const permissionStore = useStore('permissionStore');

    return (
        <div className={clsx(props.className)}>
            <AccessSelector
                accessTypes={[Access.RO_StudentGroup, Access.RW_StudentGroup, Access.None_StudentGroup]}
                onChange={(access) => {
                    const currentPermission = group.presentedDocument!.root!.groupPermissions.find(
                        (gp) => gp.groupId === group.id
                    );
                    if (currentPermission) {
                        currentPermission.setAccess(access);
                    } else {
                        permissionStore.createGroupPermission(group.presentedDocument!.root!, group, access);
                    }
                    documentRoots.forEach((dr) => {
                        const currentPermission = dr.groupPermissions.find((gp) => gp.groupId === group.id);
                        if (currentPermission) {
                            currentPermission.setAccess(access);
                        } else {
                            permissionStore.createGroupPermission(dr, group, access);
                        }
                    });
                }}
                mark={props.mark}
            />
        </div>
    );
});

export default GroupAccessSelector;
