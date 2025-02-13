import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import { useStore } from '@tdev-hooks/useStore';
import Popup from 'reactjs-popup';
import AddOrUpdateFile from '.';
import Button from '@tdev-components/shared/Button';
import { mdiFileEdit, mdiFileMove, mdiFilePlus } from '@mdi/js';
import { trimSlashes } from '@tdev-models/helpers/trimSlashes';
import { PopupActions } from 'reactjs-popup/dist/types';
import { ApiState } from '@tdev-stores/iStore';
import FileStub from '@tdev-models/cms/FileStub';
import File from '@tdev-models/cms/File';
import { resolvePath } from '@tdev-models/helpers/resolvePath';

interface Props {
    file: File | FileStub;
    disabled?: boolean;
    size?: number;
}

const IsDirRegex = /\//;

const RenameFilePopup = observer((props: Props) => {
    const cmsStore = useStore('cmsStore');
    const { file } = props;
    const ref = React.useRef<PopupActions>(null);
    const { github, activeBranchName } = cmsStore;
    React.useEffect(() => {
        if (file.type !== 'file') {
            cmsStore.fetchFile(file.path, file.branch);
        }
    }, [file]);

    if (!github || !activeBranchName || file.type !== 'file') {
        return null;
    }

    return (
        <Popup
            trigger={
                <div style={{ display: 'flex' }}>
                    <Button
                        icon={mdiFileEdit}
                        color="orange"
                        size={props.size || 0.8}
                        disabled={props.disabled}
                    />
                </div>
            }
            on="click"
            disabled={props.disabled}
            modal
            ref={ref}
            overlayStyle={{ background: 'rgba(0,0,0,0.5)' }}
        >
            <AddOrUpdateFile
                file={file}
                onCreateOrUpdate={(fileName: string) => {
                    const newPath = resolvePath(file.parentPath || '', fileName);
                    return github
                        .createOrUpdateFile(
                            newPath,
                            file.content,
                            activeBranchName,
                            file.sha,
                            `Rename ${fileName}`,
                            file.isImage
                        )
                        .then((movedFile) => {
                            if (movedFile) {
                                return github.deleteFile(file).then(() => {
                                    return movedFile;
                                });
                            }
                            return movedFile;
                        })
                        .then((movedFile) => {
                            if (movedFile) {
                                cmsStore.github?.clearEntries(file.branch);
                                cmsStore.fetchFile(movedFile.path, movedFile.branch).then((reloadedFile) => {
                                    if (reloadedFile) {
                                        reloadedFile.openRecursive();
                                    }
                                });
                                // cmsStore.setActiveEntry(movedFile, true);
                            }
                            ref.current?.close();
                            return { state: ApiState.SUCCESS };
                        })
                        .catch((e) => {
                            return { state: ApiState.ERROR, message: e.message };
                        });
                }}
                onDiscard={() => {
                    ref.current?.close();
                }}
            />
        </Popup>
    );
});

export default RenameFilePopup;
