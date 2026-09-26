import { mdiAccountCircle, mdiDelete } from '@mdi/js';
import Icon from '@mdi/react';
import { Access } from '@tdev-api/document';
import Button from '@tdev-components/shared/Button';
import { useStore } from '@tdev-hooks/useStore';
import { default as UserPermissionModel } from '@tdev-models/UserPermission';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import AccessSelector from '../AccessSelector';
import styles from '../Permission.module.scss';

interface SingleProps {
    permission: UserPermissionModel;
    documentRootId?: string;
    permissions?: never;
    documentRootIds?: never;
}
interface MultiProps {
    permissions: UserPermissionModel[];
    documentRootIds?: string[];
    permission?: never;
    documentRootId?: never;
}
type Props = SingleProps | MultiProps;

const UserPermission = observer((props: Props) => {
    const { permission, permissions } = props;
    const models = permissions || [permission];
    const permissionStore = useStore('permissionStore');
    const docRootIds = (props.documentRootId ? [props.documentRootId] : props.documentRootIds) || [];
    const userStore = useStore('userStore');
    if (models.length === 0) {
        const { viewedUser } = userStore;
        if (docRootIds.length === 0 || !viewedUser) {
            return null;
        }
        return (
            <AccessSelector
                accessTypes={[Access.RO_User, Access.RW_User, Access.None_User]}
                access={undefined}
                onChange={(access) => {
                    docRootIds.forEach((docRootId) => {
                        permissionStore.createUserPermission(docRootId, viewedUser, access);
                    });
                }}
            />
        );
    }
    const firstModel = models[0];
    if (!models.every((p) => p.userId === firstModel.userId)) {
        throw new Error('GroupPermission: All provided permissions must concerne the same user');
    }
    const accessLevels = new Set(models.map((p) => p.access));
    const allCommon = accessLevels.size === 1;
    return (
        <div className={clsx(styles.permission)}>
            <span
                className={clsx(styles.audience)}
                title={allCommon ? undefined : 'Es haben aktuell nicht alle Dokumente dieselbe Berechtigung!'}
            >
                <Icon
                    path={mdiAccountCircle}
                    color={`var(--ifm-color-${allCommon ? 'primary' : 'warning'})`}
                    size={0.8}
                />
                {firstModel.user?.nameShort || firstModel.userId}
            </span>
            <span className={clsx(styles.spacer)} />
            <AccessSelector
                accessTypes={[Access.RO_User, Access.RW_User, Access.None_User]}
                access={allCommon ? firstModel.access : undefined}
                onChange={(access) => {
                    models.forEach((p) => {
                        p.setAccess(access);
                    });
                }}
                mark={allCommon ? undefined : accessLevels}
            />
            <span className={clsx(styles.actions)}>
                <Button
                    onClick={() => {
                        models.forEach((permission) => {
                            permission.delete();
                        });
                    }}
                    color="red"
                    icon={mdiDelete}
                />
            </span>
        </div>
    );
});

export default UserPermission;
