import React from 'react';

import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import { mdiFolderCancel, mdiFolderEditOutline } from '@mdi/js';
import { useStore } from '@tdev-hooks/useStore';
import Button from '@tdev-components/shared/Button';
import requestDocusaurusRootAcess from '@tdev-components/util/localFS/requestDocusaurusRootAcess';

const IsDevMode = process.env.NODE_ENV === ('development' as const);

const DevModeAccessLocalFS = observer(() => {
    const sessionStore = useStore('sessionStore');
    if (!IsDevMode) {
        return null;
    }
    const rootHandle = sessionStore.fileSystemDirectoryHandles.get('root');
    return (
        <div className={styles.profileButton}>
            <Button
                icon={rootHandle ? mdiFolderEditOutline : mdiFolderCancel}
                color={rootHandle ? 'primary' : 'grey'}
                title={
                    rootHandle
                        ? `Zugriff auf lokale Dateien in ${rootHandle.name}`
                        : 'Kein Zugriff auf lokale Dateien'
                }
                onClick={async () => {
                    const docRootHandle = await requestDocusaurusRootAcess();
                    if (docRootHandle) {
                        sessionStore.setFileSystemDirectoryHandle('root', docRootHandle);
                    }
                }}
            />
        </div>
    );
});

export default DevModeAccessLocalFS;
