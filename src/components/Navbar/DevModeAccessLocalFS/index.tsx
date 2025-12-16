import React from 'react';

import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import { mdiFolderCancel, mdiFolderCancelOutline, mdiFolderEditOutline } from '@mdi/js';
import { useStore } from '@tdev-hooks/useStore';
import Button from '@tdev-components/shared/Button';
import requestDocusaurusRootAcess from '@tdev-components/util/localFS/requestDocusaurusRootAcess';
import clsx from 'clsx';
import {
    FS_DocusaurusRootID,
    restoreAccess
} from '@tdev-components/util/localFS/requestLocalDirectoryAccess';
import { indexedDb } from '@tdev-api/base';

const IsDevMode = process.env.NODE_ENV === ('development' as const);

const DevModeAccessLocalFS = observer(() => {
    const sessionStore = useStore('sessionStore');
    const [hovered, setHovered] = React.useState(false);
    const ref = React.useRef<HTMLDivElement>(null);
    if (!IsDevMode) {
        return null;
    }
    React.useEffect(() => {
        restoreAccess(FS_DocusaurusRootID, 'readwrite', ['docusaurus.config.ts']).then((dirHandle) => {
            if (dirHandle) {
                sessionStore.setFileSystemDirectoryHandle('root', dirHandle);
            }
        });
    }, [sessionStore]);
    React.useEffect(() => {
        const onMouseOver = () => setHovered(true);
        const onMouseOut = () => setHovered(false);
        if (ref.current) {
            ref.current.onmouseover = onMouseOver;
            ref.current.onmouseout = onMouseOut;
        }
        return () => {
            if (ref.current) {
                ref.current.onmouseover = null;
                ref.current.onmouseout = null;
            }
        };
    }, [ref]);
    const rootHandle = sessionStore.fileSystemDirectoryHandles.get('root');
    return (
        <div className={styles.buttonWrapper} ref={ref}>
            <Button
                icon={
                    rootHandle ? (hovered ? mdiFolderCancelOutline : mdiFolderEditOutline) : mdiFolderCancel
                }
                color={rootHandle ? (hovered ? 'red' : 'primary') : 'grey'}
                title={
                    rootHandle
                        ? hovered
                            ? `Entferne Zugriff auf lokale Dateien in ${rootHandle.name}.`
                            : `Zugriff auf lokale Dateien in ${rootHandle.name}`
                        : 'Kein Zugriff auf lokale Dateien'
                }
                text="Dateizugriff"
                textClassName={clsx(styles.text)}
                iconSide="left"
                onClick={async () => {
                    setHovered(false);
                    if (rootHandle) {
                        indexedDb.delete('fsHandles', FS_DocusaurusRootID);
                        sessionStore.setFileSystemDirectoryHandle('root', undefined);
                    } else {
                        await requestDocusaurusRootAcess();
                    }
                }}
            />
        </div>
    );
});

export default DevModeAccessLocalFS;
