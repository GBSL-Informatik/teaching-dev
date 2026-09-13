import { mdiFileEdit } from '@mdi/js';
import Button from '@tdev-components/shared/Button';
import { resolvePath } from '@tdev-models/helpers/resolvePath';
import { ApiState } from '@tdev-stores/iStore';
import { action } from 'mobx';
import { observer } from 'mobx-react-lite';
import React from 'react';
import Popup from 'reactjs-popup';
import { PopupActions } from 'reactjs-popup/dist/types';
import AddOrUpdateFile from '.';
import { useCmsStore } from '../../../../../hooks/useCmsStore';
import BinFile from '../../../../../models/BinFile';
import File from '../../../../../models/File';
import FileStub from '../../../../../models/FileStub';

interface Props {
    file: File | BinFile | FileStub;
    disabled?: boolean;
    size?: number;
}

const RenameFilePopup = observer((props: Props) => {
    const cmsStore = useCmsStore();
    const ref = React.useRef<PopupActions>(null);
    const { github, activeBranchName } = cmsStore;
    const file = cmsStore.findEntry(props.file.branch, props.file.path) as File | BinFile | FileStub;

    if (!github || !activeBranchName || !file) {
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
                        disabled={props.disabled || !cmsStore.canModifyActiveBranch}
                    />
                </div>
            }
            on="click"
            disabled={props.disabled}
            onOpen={action(() => {
                if (file.mustBeFetched && !file.isSyncing) {
                    cmsStore.fetchFile(file);
                }
            })}
            modal
            ref={ref}
            overlayStyle={{ background: 'rgba(0,0,0,0.5)' }}
        >
            <AddOrUpdateFile
                file={file}
                onCreateOrUpdate={(fileName, isUpdate) => {
                    const newPath = resolvePath(file.parentPath || '', fileName);
                    if (!file.isLoadedFile()) {
                        return Promise.resolve({ state: ApiState.ERROR, message: 'File not loaded' });
                    }
                    return github
                        .createOrUpdateFile(
                            newPath,
                            file.fileContent,
                            activeBranchName,
                            file.sha,
                            `Rename ${fileName}`
                        )
                        .then((movedFile) => {
                            if (movedFile) {
                                return github.deleteFile(file).then(() => {
                                    github._rmFileEntry(file);
                                    return movedFile;
                                });
                            }
                            return movedFile;
                        })
                        .then((movedFile) => {
                            if (movedFile) {
                                cmsStore.setActiveEntry(movedFile);
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
