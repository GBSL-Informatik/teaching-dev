import React from 'react';
import clsx from 'clsx';

import { mdiClose, mdiTrashCan, mdiTrashCanOutline } from '@mdi/js';
import { Color } from '@tdev-components/shared/Colors';
import { Confirm } from '@tdev-components/shared/Button/Confirm';

interface Props {
    className?: string;
    onDelete: () => void;
    title?: string;
    icon?: string;
    iconOutline?: string;
    color?: Color | string;
    confirmMessage?: string;
    text?: string | null;
    disabled?: boolean;
    size?: number;
}

export const Delete = (props: Props) => {
    return (
        <Confirm
            onConfirm={props.onDelete}
            title={props.title}
            icon={props.icon || mdiTrashCan}
            text={props.text ?? 'Löschen'}
            color={props.color || 'red'}
            confirmIcon={props.iconOutline || mdiTrashCanOutline}
            confirmText={props.confirmMessage}
            size={props.size || 1}
            disabled={props.disabled}
            className={props.className}
            cancelIcon={mdiClose}
        />
    );
};
