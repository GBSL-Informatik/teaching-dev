import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import { useStore } from '@tdev-hooks/useStore';
import Popup from 'reactjs-popup';
import AddFile from '.';
import Button from '@tdev-components/shared/Button';
import { mdiFilePlus } from '@mdi/js';
import { trimSlashes } from '@tdev-models/helpers/trimSlashes';
import { PopupActions } from 'reactjs-popup/dist/types';
import { ApiState } from '@tdev-stores/iStore';
import Dir from '@tdev-models/cms/Dir';

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
                <span>
                    <Button icon={mdiFilePlus} color="blue" size={0.8} />
                </span>
            }
            on="click"
            modal
            ref={ref}
            overlayStyle={{ background: 'rgba(0,0,0,0.5)' }}
        >
            <AddFile
                onCreate={(path: string) => {
                    const trimmedPath = trimSlashes(path);
                    const absPath = `${trimSlashes(dir.path)}/${trimmedPath}`;
                    const isDir = /\//.test(trimmedPath);
                    return github
                        .createOrUpdateFile(absPath, '\n', activeBranchName, undefined, `Create new ${path}`)
                        .then((file) => {
                            if (isDir && file) {
                                return (dir.fetchDirectory(true) || Promise.resolve()).then(() => {
                                    ref.current?.close();
                                    return { state: ApiState.SUCCESS };
                                });
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
