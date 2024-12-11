import React from 'react';
import clsx from 'clsx';
import styles from '../Permission.module.scss';
import { observer } from 'mobx-react-lite';
import { default as UserPermissionModel } from '@tdev-models/UserPermission';
import AccessSelector from '../AccessSelector';
import Button from '@tdev-components/shared/Button';
import { mdiAccountCircle, mdiDelete } from '@mdi/js';
import Icon from '@mdi/react';
import { Access } from '@tdev-api/document';

interface SingleProps {
    permission: UserPermissionModel;
    permissions?: never;
}
interface MultiProps {
    permissions: UserPermissionModel[];
    permission?: never;
}
type Props = SingleProps | MultiProps;

const UserPermission = observer((props: Props) => {
    const { permission, permissions } = props;
    const models = permissions || [permission];
    if (models.length === 0) {
        return null;
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
