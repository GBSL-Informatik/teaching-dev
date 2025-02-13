import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import { useStore } from '@tdev-hooks/useStore';
import Popup from 'reactjs-popup';
import AddOrUpdateFile from '.';
import Button from '@tdev-components/shared/Button';
import { mdiFilePlus } from '@mdi/js';
import { trimSlashes } from '@tdev-models/helpers/trimSlashes';
import { PopupActions } from 'reactjs-popup/dist/types';
import { ApiState } from '@tdev-stores/iStore';
import Dir from '@tdev-models/cms/Dir';
import { resolvePath } from '@tdev-models/helpers/resolvePath';

interface Props {
    dir: Dir;
}

const AddFilePopup = observer((props: Props) => {
    const cmsStore = useStore('cmsStore');
    const { dir } = props;
    const ref = React.useRef<PopupActions>(null);

    const { github, activeBranchName } = cmsStore;
    if (!github || !activeBranchName) {
        return null;
    }

    return (
        <Popup
            trigger={
                <div style={{ display: 'flex' }}>
                    <Button icon={mdiFilePlus} color="blue" size={0.8} />
                </div>
            }
            on="click"
            modal
            ref={ref}
            overlayStyle={{ background: 'rgba(0,0,0,0.5)' }}
        >
            <AddOrUpdateFile
                onCreateOrUpdate={(path: string) => {
                    const absPath = resolvePath(dir.path, path);
                    const isDir = /\//.test(path);
                    return github
                        .createOrUpdateFile(absPath, '\n', activeBranchName, undefined, `Create new ${path}`)
                        .then((file) => {
                            ref.current?.close();
                            if (file) {
                                cmsStore.setActiveEntry(file, true);
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
