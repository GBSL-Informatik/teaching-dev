import React from 'react';
import clsx from 'clsx';

import styles from './styles.module.scss';
import Button from '..';
import { mdiClose, mdiTrashCan, mdiTrashCanOutline } from '@mdi/js';

interface Props {
    className?: string;
    onDelete: () => void;
}
export const Delete = (props: Props) => {
    const [confirmDelete, setConfirmDelete] = React.useState(false);
    return (
        <div className={clsx(styles.delete, props.className, 'button-group')}>
            {confirmDelete && (
                <Button
                    icon={mdiClose}
                    iconSide="left"
                    size={1}
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setConfirmDelete(false);
                    }}
                />
            )}
            <Button
                text={confirmDelete ? 'Ja' : 'Löschen'}
                color="red"
                icon={confirmDelete ? mdiTrashCan : mdiTrashCanOutline}
                size={1}
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (confirmDelete) {
                        props.onDelete();
                    } else {
                        setConfirmDelete(true);
                    }
                }}
            />
        </div>
    );
};

export default Button;
