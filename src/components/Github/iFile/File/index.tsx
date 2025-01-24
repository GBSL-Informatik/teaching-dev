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
import { mdiCircleEditOutline, mdiContentSave, mdiLoading, mdiRestore } from '@mdi/js';
import { useStore } from '@tdev-hooks/useStore';
import { ApiState } from '@tdev-stores/iStore';
import Link from '@docusaurus/Link';
import { Delete } from '@tdev-components/shared/Button/Delete';
interface Props {
    file: FileModel | FileStub;
}

const File = observer((props: Props) => {
    const cmsStore = useStore('cmsStore');
    const { file } = props;
    return (
        <li className={clsx(styles.file, shared.item)}>
            <Link
                onClick={() => {
                    cmsStore.setIsEditing(file, true);
                }}
            >
                <Icon path={file.icon} size={0.8} color={file.iconColor} />
                <span className={clsx(shared.item)}>{file.name}</span>
            </Link>
            {file.isImage ? (
                <ImagePreview file={file} />
            ) : (
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
                    size={0.8}
                />
            )}
            {file.type === 'file' && file.isDirty && (
                <>
                    <Button
                        icon={file.apiState === ApiState.SYNCING ? mdiLoading : mdiContentSave}
                        spin={file.apiState === ApiState.SYNCING}
                        color="green"
                        size={0.7}
                        disabled={cmsStore.isOnMainBranch}
                        onClick={() => {
                            file.save();
                        }}
                    />
                    <Button
                        icon={mdiRestore}
                        color="black"
                        size={0.7}
                        onClick={() => {
                            file.reset();
                        }}
                    />
                </>
            )}
        </li>
    );
});
export default File;
