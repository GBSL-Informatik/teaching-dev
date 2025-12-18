import {
    mdiCircle,
    mdiClose,
    mdiFileMove,
    mdiFileMoveOutline,
    mdiFolderMove,
    mdiFolderMoveOutline,
    mdiFolderOpen,
    mdiFolderOutline
} from '@mdi/js';
import styles from './styles.module.scss';
import Button from '@tdev-components/shared/Button';
import Directory from '@tdev-models/documents/FileSystem/Directory';
import { observer } from 'mobx-react-lite';
import clsx from 'clsx';
import React from 'react';
import { DocumentType } from '@tdev-api/document';
import Icon, { Stack } from '@mdi/react';
import { getNumericCircleIcon } from '@tdev-components/shared/numberIcons';
import type iFileSystem from '@tdev-models/documents/FileSystem/iFileSystem';

interface DirProps {
    item: iFileSystem<any>;
    dir: Directory;
    fileType: DocumentType;
    moveTo: (dir: Directory) => void;
    children?: React.ReactNode;
}

const DirTree = observer((props: DirProps) => {
    const { dir, item } = props;
    const [confirmMove, setConfirmMove] = React.useState(false);
    const [isOpen, setIsOpen] = React.useState(item.path.some((p) => p.id === dir.id));
    const disabled = dir.id === item.id || dir.children.some((c) => c.id === item.id);
    return (
        <>
            <div
                className={clsx(styles.moveTo)}
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsOpen(!isOpen);
                }}
            >
                <div className={clsx(styles.stacked)}>
                    <Icon
                        path={isOpen ? mdiFolderOpen : mdiFolderOutline}
                        size={1}
                        color={disabled ? 'var(--ifm-color-disabled)' : 'var(--ifm-color-primary)'}
                    />
                    {dir.id !== item.id && (
                        <Stack className={clsx(styles.topRight)} size={0.7} color={null}>
                            <Icon path={mdiCircle} color="white" size={0.8} />
                            <Icon
                                path={getNumericCircleIcon(dir.directories.length)}
                                color="var(--ifm-color-primary-darkest)"
                            />
                        </Stack>
                    )}
                </div>
                <div>{dir.name}</div>
                <div className={clsx(styles.spacer)} />
                <div className={clsx(styles.move, 'button-group button-group--block')}>
                    {confirmMove && (
                        <Button
                            icon={mdiClose}
                            iconSide="left"
                            size={1}
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setConfirmMove(false);
                            }}
                        />
                    )}
                    <Button
                        text={confirmMove ? 'Ja' : ''}
                        color={'primary'}
                        icon={
                            props.fileType === 'dir'
                                ? confirmMove
                                    ? mdiFolderMove
                                    : mdiFolderMoveOutline
                                : confirmMove
                                  ? mdiFileMove
                                  : mdiFileMoveOutline
                        }
                        title={'Hierhin verschieben?'}
                        size={1}
                        disabled={disabled}
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (confirmMove) {
                                props.moveTo(dir);
                            } else {
                                setConfirmMove(true);
                            }
                        }}
                    />
                </div>
            </div>
            {isOpen && dir.id !== item.id && (
                <div className={clsx(styles.content)}>
                    {dir.directories.map((c) => {
                        return (
                            <DirTree
                                key={c.id}
                                dir={c}
                                fileType={props.fileType}
                                moveTo={props.moveTo}
                                item={item}
                            />
                        );
                    })}
                </div>
            )}
        </>
    );
});

export default DirTree;
