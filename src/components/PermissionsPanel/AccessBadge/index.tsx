import { mdiEye, mdiEyeOff, mdiSquareEditOutline } from '@mdi/js';
import Icon from '@mdi/react';
import { Access } from '@tdev-api/document';
import { IfmColors } from '@tdev-components/shared/Colors';
import { NoneAccess, ROAccess, RWAccess } from '@tdev-models/helpers/accessPolicy';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import styles from './styles.module.scss';
const SIZE = 0.8;
export const AccessIcon = (access?: Access) => {
    if (RWAccess.has(access)) {
        return mdiSquareEditOutline;
    }
    if (ROAccess.has(access)) {
        return mdiEye;
    }
    return mdiEyeOff;
};

export const AccessColor = (access?: Access) => {
    if (RWAccess.has(access)) {
        return IfmColors.green;
    }
    if (ROAccess.has(access)) {
        return IfmColors.lightBlue;
    }
    if (NoneAccess.has(access)) {
        return IfmColors.danger;
    }
    return undefined;
};

interface Props {
    access?: Access;
    defaultAccess?: Access;
    className?: string;
    size?: number;
}

const AccessBadge = observer((props: Props) => {
    return (
        <div className={clsx('badge', 'badge--secondary', styles.accessBadge, props.className)}>
            <Icon
                path={AccessIcon(props.access || props.defaultAccess || Access.None_DocumentRoot)}
                size={props.size || SIZE}
                color="var(--ifm-color-blue)"
            />
        </div>
    );
});

export default AccessBadge;
