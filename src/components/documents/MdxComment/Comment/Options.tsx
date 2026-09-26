import { mdiClose, mdiTrashCan, mdiTrashCanOutline } from '@mdi/js';
import Button from '@tdev-components/shared/Button';
import { Color } from '@tdev-components/shared/Colors';
import MdxComment from '@tdev-models/documents/MdxComment';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import React from 'react';
import sharedStyles from '../styles.module.scss';
import styles from './options.module.scss';

interface Props {
    comment: MdxComment;
}

const COLORS: Color[] = ['blue', 'green', 'orange', 'red', 'lightBlue'];

const Options = observer((props: Props) => {
    const [confirmDelete, setConfirmDelete] = React.useState(false);
    const { comment } = props;
    return (
        <div className={clsx(styles.options)}>
            <div className={clsx(styles.option)}>
                <div className={clsx(styles.colors)}>
                    {COLORS.map((color, idx) => (
                        <div
                            key={idx}
                            className={clsx(
                                sharedStyles[color],
                                color === comment.color && styles.active,
                                styles.color,
                                sharedStyles.colorized,
                                sharedStyles.active
                            )}
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                comment.setColor(color);
                            }}
                        />
                    ))}
                </div>
            </div>

            <div className={clsx(styles.delete)}>
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
                            comment.delete();
                        } else {
                            setConfirmDelete(true);
                        }
                    }}
                />
            </div>
        </div>
    );
});

export default Options;
