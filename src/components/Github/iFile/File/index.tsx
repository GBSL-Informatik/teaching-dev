import React from 'react';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import { default as FileModel } from '@tdev-models/cms/File';
import FileStub from '@tdev-models/cms/FileStub';
import shared from '../styles.module.scss';
import styles from './styles.module.scss';
import ImagePreview from './ImagePreview';
import Icon from '@mdi/react';
import Button from '@tdev-components/shared/Button';
import { mdiContentSave, mdiLoading, mdiRestore } from '@mdi/js';
import { useStore } from '@tdev-hooks/useStore';
import { ApiState } from '@tdev-stores/iStore';
import Link from '@docusaurus/Link';
import { Delete } from '@tdev-components/shared/Button/Delete';
import RenameFilePopup from './AddOrUpdateFile/RenameFilePopup';
interface Props {
    file: FileModel | FileStub;
}

const BUTTON_SIZE = 0.7;

const File = observer((props: Props) => {
    const cmsStore = useStore('cmsStore');
    const { file } = props;
    return (
        <li className={clsx(styles.file, shared.item)}>
            <Link
                onClick={() => {
                    if (!file.isAsset) {
                        cmsStore.setIsEditing(file, true);
                    }
                }}
                className={clsx(styles.fileLink)}
            >
                <Icon path={file.icon} size={BUTTON_SIZE} color={file.iconColor} />
                <span className={clsx(shared.item)}>{file.name}</span>
            </Link>
            {file.isImage && (
                <ImagePreview src={file.type === 'file' ? FileModel.ImageDataUrl(file) : file.downloadUrl} />
            )}
            <div className={clsx(styles.actions)}>
                <Delete
                    onDelete={() => {
                        cmsStore.github?.deleteFile(file);
                    }}
                    disabled={cmsStore.isOnMainBranch}
                    text={''}
                    title={
                        cmsStore.isOnMainBranch
                            ? `Es können keine Dateien im ${cmsStore.github?.defaultBranchName || 'main'}-Branch gelöscht werden.`
                            : undefined
                    }
                    size={BUTTON_SIZE}
                />
                {file.type === 'file' && file.isDirty && (
                    <>
                        <Button
                            icon={file.apiState === ApiState.SYNCING ? mdiLoading : mdiContentSave}
                            spin={file.apiState === ApiState.SYNCING}
                            color="green"
                            size={BUTTON_SIZE}
                            disabled={cmsStore.isOnMainBranch}
                            onClick={() => {
                                file.save();
                            }}
                        />
                        <Button
                            icon={mdiRestore}
                            color="black"
                            size={BUTTON_SIZE}
                            onClick={() => {
                                file.reset();
                            }}
                        />
                    </>
                )}
                <RenameFilePopup
                    file={file}
                    disabled={file.type === 'file' && file.isDirty}
                    size={BUTTON_SIZE}
                />
            </div>
        </li>
    );
});
export default File;
