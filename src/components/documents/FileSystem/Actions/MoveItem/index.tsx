import styles from './styles.module.scss';
import Directory from '@tdev-models/documents/FileSystem/Directory';
import File from '@tdev-models/documents/FileSystem/File';
import { observer } from 'mobx-react-lite';
import clsx from 'clsx';
import React from 'react';
import { DocumentType } from '@tdev-api/document';
import DirTree from './DirTree';
import { useStore } from '@tdev-hooks/useStore';
import { action } from 'mobx';

interface Props {
    item: File | Directory;
}

const MoveItem = observer((props: Props) => {
    const { item } = props;
    const documentStore = useStore('documentStore');
    const root = item.path.filter((p) => p.type === 'dir')[0];
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
