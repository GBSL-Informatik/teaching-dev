import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import shared from '../shared.module.scss';
import { observer } from 'mobx-react-lite';
import { default as DirctoryModel, ModelMeta } from '@tdev-models/documents/FileSystem/Directory';
import Icon from '@mdi/react';
import { mdiFolder, mdiFolderOpen } from '@mdi/js';
import SyncStatus from '../../../SyncStatus';
import NewItem from './NewItem';
import File from '../File';
import Actions from '../Actions';
import Name from '../Name';
import { MetaInit } from '@tdev-models/documents/FileSystem/iFileSystem';
import { useFirstMainDocument } from '@tdev-hooks/useFirstMainDocument';
import Loader from '@tdev-components/Loader';
import FsDetails from '../FsDetails';
import MoveItem from '../Actions/MoveItem';

interface Props extends MetaInit {
    id: string;
}

const Directory = observer((props: Props) => {
    const [meta] = React.useState(new ModelMeta(props));
    const doc = useFirstMainDocument(props.id, meta);
    const isInitialized = React.useRef(false);
    React.useEffect(() => {
        isInitialized.current = true;
    }, []);
    if (!doc || !doc.isInitialized) {
        return <Loader />;
    }
    return <DirectoryComponent dir={doc} />;
});

interface DirectoryProps {
    dir: DirctoryModel;
    isNested?: boolean;
}

export const DirectoryComponent = observer((props: DirectoryProps) => {
    const { dir } = props;
    return (
        <FsDetails
            model={dir}
            className={clsx(shared.fsItem, styles.dir, props.isNested && styles.isNested)}
            summary={
                <summary className={clsx(shared.summary, styles.summary)}>
                    <Icon
                        path={dir.isOpen ? mdiFolderOpen : mdiFolder}
                        size={0.8}
                        className={clsx(shared.icon)}
                    />
                    <Name model={dir} className={shared.name} />
                    <div className={clsx(shared.syncState)}>
                        <SyncStatus model={dir} />
                    </div>
                    <div
                        className={clsx(shared.actions)}
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            e.bubbles = false;
                        }}
                    >
                        {dir.isOpen && <NewItem directory={dir} />}
                        <Actions item={dir} />
                    </div>
                </summary>
            }
        >
            <div className={clsx(shared.content, styles.content)}>
                {dir.isOpen && (
                    <>
                        {dir.files.map((file) => {
                            return <File key={file.id} file={file} />;
                        })}
                        {dir.directories.map((dir) => {
                            return <DirectoryComponent key={dir.id} dir={dir} isNested />;
                        })}
                    </>
                )}
            </div>
        </FsDetails>
    );
});

export default Directory;
