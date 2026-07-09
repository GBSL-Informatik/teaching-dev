import React from 'react';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import { default as FileModel } from '@site/packages/hfr/github-cms/models/File';
import FileStub from '@site/packages/hfr/github-cms/models/FileStub';
import shared from '../styles.module.scss';
import styles from './styles.module.scss';
import Icon from '@mdi/react';
import Button from '@tdev-components/shared/Button';
import { mdiContentSave, mdiEye, mdiLoading, mdiRestore, mdiStar } from '@mdi/js';
import { useCmsStore } from '@site/packages/hfr/github-cms/hooks/useCmsStore';
import Link from '@docusaurus/Link';
import { Delete } from '@tdev-components/shared/Button/Delete';
import RenameFilePopup from './AddOrUpdateFile/RenameFilePopup';
import BinFile from '@site/packages/hfr/github-cms/models/BinFile';
import PreviewPopup from './FilePreview/PreviewPopup';
interface Props {
    file: FileModel | BinFile | FileStub;
    showActions?: 'always' | 'hover' | 'never';
    onSelect?: (file: FileModel) => void;
}

const BUTTON_SIZE = 0.7;

const File = observer((props: Props) => {
    const cmsStore = useCmsStore();
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
                        cmsStore.setActiveEntry(file);
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
                {cmsStore.activeEntry === file && (
                    <Icon path={mdiEye} size={BUTTON_SIZE} color="var(--ifm-color-primary)" />
                )}
                {file.type === 'file' && file.isDirty && (
                    <Icon path={mdiStar} size={0.5} color="var(--ifm-color-warning)" />
                )}
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
