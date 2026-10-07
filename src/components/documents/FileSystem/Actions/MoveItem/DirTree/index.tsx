import {
    mdiCircle,
    mdiFileMove,
    mdiFileMoveOutline,
    mdiFolderMove,
    mdiFolderMoveOutline,
    mdiFolderOpen,
    mdiFolderOutline
} from '@mdi/js';
import Icon, { Stack } from '@mdi/react';
import { DocumentType } from '@tdev-api/document';
import { Confirm } from '@tdev-components/shared/Button/Confirm';
import { getNumericCircleIcon } from '@tdev-components/shared/numberIcons';
import Directory from '@tdev-models/documents/FileSystem/Directory';
import type iFileSystem from '@tdev-models/documents/FileSystem/iFileSystem';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import React from 'react';
import styles from './styles.module.scss';

interface DirProps {
    item: iFileSystem<any>;
    dir: Directory;
    fileType: DocumentType;
    moveTo: (dir: Directory) => void;
    children?: React.ReactNode;
}

const DirTree = observer((props: DirProps) => {
    const { dir, item } = props;
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
                    <Confirm
                        title={'Hierhin verschieben?'}
                        onConfirm={() => {
                            props.moveTo(dir);
                        }}
                        icon={props.fileType === 'dir' ? mdiFolderMoveOutline : mdiFileMoveOutline}
                        confirmIcon={props.fileType === 'dir' ? mdiFolderMove : mdiFileMove}
                        confirmText="Ja"
                        disabled={disabled}
                        color="primary"
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
