import {
    mdiCircle,
    mdiClose,
    mdiDotsHorizontalCircleOutline,
    mdiFileMove,
    mdiFileMoveOutline,
    mdiFolder,
    mdiFolderMove,
    mdiFolderMoveOutline,
    mdiFolderOpen,
    mdiFolderOpenOutline,
    mdiFolderOutline,
    mdiNumeric0Circle,
    mdiOneUp,
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
import Icon, { Stack } from '@mdi/react';
import { getNumericCircleIcon } from '@tdev-components/shared/numberIcons';
import DirTree from './DirTree';
import { useStore } from '@tdev-hooks/useStore';
import { action } from 'mobx';

interface Props {
    item: File | Directory;
}

const MoveItem = observer((props: Props) => {
    const { item } = props;
    const documentStore = useStore('documentStore');
    const root = item.path.filter((p) => p.type === DocumentType.Dir)[0];
    if (!root) {
        return null;
    }
    return (
        <div className={clsx(styles.moveItem, 'card')}>
            <div className={clsx('card__header', styles.header)}>
                <h3 className={clsx('card__title', styles.title)}>"{item.name}" Verschieben</h3>
            </div>
            <div className={clsx('card__body', styles.body)}>
                <DirTree
                    dir={root}
                    fileType={item.type}
                    moveTo={action((to) => {
                        documentStore.relinkParent(item, to);
                    })}
                    item={item}
                />
            </div>
        </div>
    );
});
export default MoveItem;
