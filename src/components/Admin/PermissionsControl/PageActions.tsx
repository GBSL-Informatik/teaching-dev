import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import { useStore } from '@tdev-hooks/useStore';
import { mdiAccountMultipleRemove, mdiAccountRemove } from '@mdi/js';
import { Confirm } from '@tdev-components/shared/Button/Confirm';

interface Props {
    docs: { id: string; type: string }[];
}

const PageActions = observer((props: Props) => {
    const { docs } = props;
    const docRootStore = useStore('documentRootStore');
    const permissionStore = useStore('permissionStore');

    return (
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
                                    permissionStore.deleteGroupPermission(groupPermission);
                                });
                            }
                        });
                    }}
                />
            )}
        </div>
    );
});

export default PageActions;
