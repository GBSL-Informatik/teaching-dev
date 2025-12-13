import {
    mdiClose,
    mdiDotsHorizontalCircleOutline,
    mdiFileMove,
    mdiFolderMove,
    mdiRenameOutline,
    mdiTrashCan,
    mdiTrashCanOutline
} from '@mdi/js';
import styles from './styles.module.scss';
import Button from '@tdev-components/shared/Button';
import Directory from '@tdev-models/documents/FileSystem/Directory';
import File from '@tdev-models/documents/FileSystem/File';
import { observer } from 'mobx-react-lite';
import Popup from 'reactjs-popup';
import clsx from 'clsx';
import React from 'react';
import { DocumentType } from '@tdev-api/document';
import MoveItem from './MoveItem';

interface Props {
    item: File | Directory;
}

const Actions = observer((props: Props) => {
    const [confirmDelete, setConfirmDelete] = React.useState(false);
    const { item } = props;
    return (
        <>
            <Button
                icon={mdiRenameOutline}
                color="primary"
                size={0.8}
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    item.setIsEditing(true);
                }}
            />
            {item.parentId && (
                <Popup
                    trigger={
                        <span>
                            <Button
                                icon={mdiDotsHorizontalCircleOutline}
                                size={0.8}
                                color="black"
                                className={clsx(styles.black)}
                            />
                        </span>
                    }
                    on="click"
                    position={['bottom right']}
                    arrow={false}
                    offsetX={20}
                    offsetY={5}
                    repositionOnResize
                    nested
                >
                    <div className={clsx('card', styles.card)}>
                        <div className={clsx('card__body', styles.body)}>
                            <div className={clsx(styles.delete, 'button-group button-group--block')}>
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
                                            item.delete();
                                        } else {
                                            setConfirmDelete(true);
                                        }
                                    }}
                                />
                            </div>
                            <div className={clsx(styles.move)}>
                                <Popup
                                    trigger={
                                        <span>
                                            <Button
                                                text="Verschieben"
                                                color="blue"
                                                icon={item.type === 'dir' ? mdiFolderMove : mdiFileMove}
                                                size={1}
                                            />
                                        </span>
                                    }
                                    modal
                                    overlayStyle={{ background: 'rgba(0,0,0,0.5)' }}
                                    on="click"
                                >
                                    <MoveItem item={item} />
                                </Popup>
                            </div>
                        </div>
                    </div>
                </Popup>
            )}
        </>
    );
});
export default Actions;
