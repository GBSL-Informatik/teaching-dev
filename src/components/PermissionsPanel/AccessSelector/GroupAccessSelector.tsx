import React from 'react';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import { useStore } from '@tdev-hooks/useStore';
import AccessSelector from '.';
import { Access } from '@tdev-api/document';
import StudentGroup from '@tdev-models/StudentGroup';

interface Props {
    group: StudentGroup;
    mark?: Access | Access[] | Set<Access>;
    className?: string;
}

const GroupAccessSelector = observer((props: Props) => {
    const { group } = props;
    const permissionStore = useStore('permissionStore');
    const groupPermission = permissionStore
        .groupPermissionsByDocumentRoot(group.presentedDocument?.documentRootId)
        .find((p) => p.groupId === group.id)?.access;

    return (
        <div className={clsx(props.className)}>
            <AccessSelector
                accessTypes={[Access.None_StudentGroup, Access.RO_StudentGroup, Access.RW_StudentGroup]}
                access={groupPermission}
                onChange={(access) => {
                    const currentPermission = group.presentedDocument!.root!.groupPermissions.find(
                        (gp) => gp.groupId === group.id
                    );
                    if (currentPermission) {
                        currentPermission.setAccess(access);
                    } else {
                        permissionStore.createGroupPermission(group.presentedDocument!.root!, group, access);
                    }
                }}
                mark={props.mark}
            />
        </div>
    );
});

export default GroupAccessSelector;
