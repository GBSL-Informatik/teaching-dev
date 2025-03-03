import React from 'react';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import { default as FileModel } from '@tdev-models/cms/File';
import FileStub from '@tdev-models/cms/FileStub';
import shared from '../styles.module.scss';
import styles from './styles.module.scss';
import Icon from '@mdi/react';
import Button from '@tdev-components/shared/Button';
import { mdiContentSave, mdiLoading, mdiRestore } from '@mdi/js';
import { useStore } from '@tdev-hooks/useStore';
import Link from '@docusaurus/Link';
import { Delete } from '@tdev-components/shared/Button/Delete';
import RenameFilePopup from './AddOrUpdateFile/RenameFilePopup';
import BinFile from '@tdev-models/cms/BinFile';
import PreviewPopup from './FilePreview/PreviewPopup';
interface Props {
    file: FileModel | BinFile | FileStub;
    showActions?: 'always' | 'hover' | 'never';
    onSelect?: (file: FileModel) => void;
}

const BUTTON_SIZE = 0.7;

const File = observer((props: Props) => {
    const cmsStore = useStore('cmsStore');
    const { file } = props;
    return (
        <li className={clsx(styles.file, shared.item)}>
            <Link
                onClick={() => {
                    if (props.onSelect) {
                        if (file.mustBeFetched) {
                            return;
                        }
                        props.onSelect(file as FileModel);
                    } else {
                        if (file.type !== 'bin_file') {
                            cmsStore.setIsEditing(file, true);
                        } else {
                            cmsStore.setActiveEntry(file);
                        }
                    }
                }}
                className={clsx(styles.fileLink)}
            >
                <Icon path={file.icon} size={BUTTON_SIZE} color={file.iconColor} />
                <PreviewPopup file={file} inlineTrigger>
                    <span className={clsx(shared.item, styles.fName)} title={file.name}>
                        {file.name}
                    </span>
                </PreviewPopup>
            </Link>
            {props.showActions !== 'never' && (
                <div className={clsx(styles.actions, props.showActions === 'hover' && styles.onHover)}>
                    <Delete
                        onDelete={() => {
                            cmsStore.github?.deleteFile(file);
                        }}
                        disabled={!cmsStore.canModifyActiveBranch}
                        text={''}
                        title={
                            cmsStore.canModifyActiveBranch
                                ? undefined
                                : `Es können keine Dateien im ${cmsStore.github?.defaultBranchName || 'main'}-Branch gelöscht werden.`
                        }
                        size={BUTTON_SIZE}
                    />
                    {file.type === 'file' && file.isDirty && (
                        <>
                            <Button
                                icon={file.isSyncing ? mdiLoading : mdiContentSave}
                                spin={file.isSyncing}
                                color="green"
                                size={BUTTON_SIZE}
                                disabled={!cmsStore.canModifyActiveBranch}
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
            )}
        </li>
    );
});
export default File;
