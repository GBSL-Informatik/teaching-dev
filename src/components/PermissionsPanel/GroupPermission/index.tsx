import React from 'react';
import clsx from 'clsx';
import styles from '../Permission.module.scss';
import { observer } from 'mobx-react-lite';
import AccessSelector from '../AccessSelector';
import Button from '@tdev-components/shared/Button';
import { mdiAccountSupervisorCircle, mdiDelete } from '@mdi/js';
import { default as GroupPermissionModel } from '@tdev-models/GroupPermission';
import Icon from '@mdi/react';
import { Access } from '@tdev-api/document';

interface SingleProps {
    permission: GroupPermissionModel;
    permissions?: never;
}
interface MultiProps {
    permissions: GroupPermissionModel[];
    permission?: never;
}

type Props = SingleProps | MultiProps;

const GroupPermission = observer((props: Props) => {
    const { permission, permissions } = props;
    const models = permissions || [permission];
    if (models.length === 0) {
        return null;
    }
    const firstModel = models[0];
    if (!models.every((p) => p.groupId === firstModel.groupId)) {
        throw new Error('GroupPermission: All provided permissions must have the same groupId');
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
                    path={mdiAccountSupervisorCircle}
                    color={`var(--ifm-color-${allCommon ? 'primary' : 'warning'})`}
                    size={0.8}
                />
                {firstModel.group?.name || firstModel.groupId}
            </span>
            <span className={clsx(styles.spacer)} />
            <AccessSelector
                accessTypes={[Access.RO_StudentGroup, Access.RW_StudentGroup, Access.None_StudentGroup]}
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
                        models.forEach((p) => {
                            p.delete();
                        });
                    }}
                    color="red"
                    icon={mdiDelete}
                />
            </span>
        </div>
    );
});

export default GroupPermission;
