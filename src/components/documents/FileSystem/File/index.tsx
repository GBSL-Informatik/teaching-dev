import { mdiFileOutline } from '@mdi/js';
import Icon from '@mdi/react';
import SyncStatus from '@tdev-components/SyncStatus';
import { default as FileModel } from '@tdev-models/documents/FileSystem/File';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import Actions from '../Actions';
import DocumentView from '../DocumentView';
import FsDetails from '../FsDetails';
import Name from '../Name';
import shared from '../shared.module.scss';
import styles from './styles.module.scss';

interface Props {
    file: FileModel;
    className?: string;
}

const File = observer((props: Props) => {
    const { file, className } = props;
    return (
        <FsDetails
            model={file}
            className={clsx(shared.fsItem, styles.file, className)}
            summary={
                <summary className={clsx(shared.summary, styles.summary)}>
                    <Icon
                        path={file.fileConfig?.icon ?? mdiFileOutline}
                        size={0.8}
                        className={clsx(shared.icon)}
                        color={file.fileConfig?.iconColor}
                    />
                    <Name model={file} className={shared.name} />
                    <div className={clsx(shared.syncState)}>
                        <SyncStatus model={file} />
                    </div>
                    <div className={clsx(shared.actions)}>
                        <Actions item={file} />
                    </div>
                </summary>
            }
        >
            <div className={clsx(shared.content, styles.content)}>
                {file.isOpen && <DocumentView file={file} />}
            </div>
        </FsDetails>
    );
});

export default File;
