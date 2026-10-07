import Alert from '@tdev-components/shared/Alert';
import { useStore } from '@tdev-hooks/useStore';
import Directory from '@tdev-models/documents/FileSystem/Directory';
import File from '@tdev-models/documents/FileSystem/File';
import iFileSystem from '@tdev-models/documents/FileSystem/iFileSystem';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import React from 'react';
import DirTree from './DirTree';
import styles from './styles.module.scss';

interface Props {
    item: iFileSystem | File | Directory;
    onDone?: () => void;
}

const MoveItem = observer((props: Props) => {
    const { item } = props;
    const documentStore = useStore('documentStore');
    const [pending, setPending] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
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
                {error && <Alert type="danger">{error}</Alert>}
                <DirTree
                    dir={root}
                    fileType={item.type}
                    pending={pending}
                    moveTo={async (to) => {
                        if (pending) {
                            return;
                        }
                        setPending(true);
                        setError(null);
                        try {
                            const moved = await documentStore.relinkParent(item, to);
                            if (moved) {
                                props.onDone?.();
                            } else {
                                setError('Die Datei konnte nicht verschoben werden.');
                            }
                        } finally {
                            setPending(false);
                        }
                    }}
                    item={item}
                />
            </div>
        </div>
    );
});
export default MoveItem;
