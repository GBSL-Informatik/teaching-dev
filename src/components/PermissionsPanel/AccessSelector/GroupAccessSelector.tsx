import { Access } from '@tdev-api/document';
import { useStore } from '@tdev-hooks/useStore';
import StudentGroup from '@tdev-models/StudentGroup';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import AccessSelector from '.';

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
                        permissionStore.createGroupPermission(
                            group.presentedDocumentProps?.document.documentRootId!,
                            group,
                            access
                        );
                    }
                }}
                mark={props.mark}
            />
        </div>
    );
});

export default GroupAccessSelector;
