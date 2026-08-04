import React from 'react';
import clsx from 'clsx';
import styles from '../styles.module.scss';
import { observer } from 'mobx-react-lite';
import { useStore } from '@tdev-hooks/useStore';
import StudentGroup from '@tdev-models/StudentGroup';
import { Access } from '@tdev-api/document';
import BadgeSelector from '@tdev-components/User/BadgeSelector';

interface Props {
    group: StudentGroup;
}

const FocusSelector = observer((props: Props) => {
    const { group } = props;
    const permissionStore = useStore('permissionStore');
    if (!group.presentedDocument) {
        return null;
    }
    const rootId = group.presentedDocument.documentRootId;
    return (
        <div className={clsx(styles.focusSelector)}>
            <div className={clsx(styles.studentSelector)}>
                {group.users.map((s) => (
                    <BadgeSelector
                        user={s}
                        key={s.id}
                        onClick={async (user, clearCurrent) => {
                            if (clearCurrent) {
                                await Promise.all(
                                    permissionStore
                                        .userPermissionsByDocumentRoot(rootId)
                                        .filter(
                                            (u) =>
                                                group.userIds.has(u.userId) && !group.adminIds.has(u.userId)
                                        )
                                        .map((p) => {
                                            return permissionStore.deleteUserPermission(p);
                                        })
                                );
                            }
                            const currentPermission = permissionStore
                                .userPermissionsByDocumentRoot(rootId)
                                .find((p) => p.userId === user.id);
                            if (currentPermission) {
                                await permissionStore.deleteUserPermission(currentPermission);
                            } else {
                                await permissionStore.createUserPermission(rootId, user, Access.RW_User);
                            }
                        }}
                        selected={permissionStore
                            .userPermissionsByDocumentRoot(rootId)
                            .some((p) => p.userId === s.id)}
                    />
                ))}
            </div>
        </div>
    );
});

export default FocusSelector;
