import { mdiFilePlus } from '@mdi/js';
import Button from '@tdev-components/shared/Button';
import { resolvePath } from '@tdev-models/helpers/resolvePath';
import { ApiState } from '@tdev-stores/iStore';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import React from 'react';
import Popup from 'reactjs-popup';
import { PopupActions } from 'reactjs-popup/dist/types';
import { v4 as uuidv4 } from 'uuid';
import AddOrUpdateFile from '.';
import { useCmsStore } from '../../../../../hooks/useCmsStore';
import Dir from '../../../../../models/Dir';
import styles from './styles.module.scss';

interface Props {
    dir: Dir;
    className?: string;
}

const AddFilePopup = observer((props: Props) => {
    const cmsStore = useCmsStore();
    const { dir } = props;
    const ref = React.useRef<PopupActions>(null);

    const { github, activeBranchName } = cmsStore;
    if (!github || !activeBranchName) {
        return null;
    }

    return (
        <Popup
            trigger={
                <div className={clsx(styles.addFile, props.className)}>
                    <Button
                        icon={mdiFilePlus}
                        color="blue"
                        size={0.8}
                        disabled={!cmsStore.canModifyActiveBranch}
                        title={
                            cmsStore.canModifyActiveBranch
                                ? undefined
                                : `Inhalte auf dem ${cmsStore.github?.defaultBranchName}-Branch können nicht direkt modifiziert werden. Branch wechseln!`
                        }
                    />
                </div>
            }
            on="click"
            modal
            ref={ref}
            overlayStyle={{ background: 'rgba(0,0,0,0.5)' }}
        >
            <AddOrUpdateFile
                onCreateOrUpdate={(path, isUpdate) => {
                    const absPath = resolvePath(dir.path, path);
                    const isMarkdown = /\.mdx?$/i.test(path);
                    const content = isMarkdown ? `---\npage_id: ${uuidv4()}\n---\n` : '\n';
                    return github
                        .createOrUpdateFile(
                            absPath,
                            content,
                            activeBranchName,
                            undefined,
                            `Create new ${path}`
                        )
                        .then((file) => {
                            ref.current?.close();
                            if (file) {
                                cmsStore.setActiveEntry(file);
                            }
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

export default AddFilePopup;
