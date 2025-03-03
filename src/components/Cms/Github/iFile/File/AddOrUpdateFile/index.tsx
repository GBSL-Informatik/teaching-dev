import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import Card from '@tdev-components/shared/Card';
import TextInput from '@tdev-components/shared/TextInput';
import Button from '@tdev-components/shared/Button';
import { mdiClose, mdiFileEdit, mdiFileMove, mdiFilePlus, mdiLoading } from '@mdi/js';
import { ApiState } from '@tdev-stores/iStore';
import Alert from '@tdev-components/shared/Alert';
import FileStub from '@tdev-models/cms/FileStub';
import File from '@tdev-models/cms/File';
import { resolvePath } from '@tdev-models/helpers/resolvePath';
import { Confirm } from '@tdev-components/shared/Button/Confirm';
import BinFile from '@tdev-models/cms/BinFile';
import { useStore } from '@tdev-hooks/useStore';

export type Response = { state: ApiState; message?: string };

interface Props {
    onDiscard: () => void;
    onCreateOrUpdate: (path: string, isUpdating: boolean) => Promise<Response>;
    file?: File | BinFile | FileStub;
}

const AddOrUpdateFile = observer((props: Props) => {
    const [alert, setAlert] = React.useState('');
    const cmsStore = useStore('cmsStore');
    const [name, setName] = React.useState(props.file?.name || '');
    const [apiState, setApiState] = React.useState(ApiState.IDLE);
    const isUpdate = !!props.file;
    const isSameDir = !/\//.test(name);

    return (
        <Card
            classNames={{ card: clsx(styles.addFile) }}
            header={<h4>Datei Hinzufügen</h4>}
            footer={
                <div className={clsx('button-group', 'button-group--block')}>
                    <Button
                        text="Abbrechen"
                        icon={mdiClose}
                        onClick={() => {
                            props.onDiscard();
                        }}
                        color="black"
                        disabled={apiState !== ApiState.IDLE}
                        iconSide="left"
                    />
                    <Confirm
                        text={isUpdate ? 'Datei aktualisieren' : 'Datei erstellen'}
                        icon={
                            apiState === ApiState.SYNCING
                                ? mdiLoading
                                : isUpdate
                                  ? isSameDir
                                      ? mdiFileEdit
                                      : mdiFileMove
                                  : mdiFilePlus
                        }
                        className={clsx(styles.confirm)}
                        buttonClassName={clsx(styles.confirmButton)}
                        spin={apiState === ApiState.SYNCING}
                        onConfirm={() => {
                            setApiState(ApiState.SYNCING);
                            props.onCreateOrUpdate(name, isUpdate).then((res) => {
                                if (res.state === 'error') {
                                    setAlert(res.message || '');
                                    setApiState(ApiState.IDLE);
                                }
                            });
                        }}
                        disableConfirm={!props.file?.isOnMainBranch}
                        disabled={
                            !name ||
                            name === props.file?.name ||
                            apiState !== ApiState.IDLE ||
                            (props.file && props.file.mustBeFetched) ||
                            !cmsStore.canModifyActiveBranch
                        }
                        color={isUpdate ? 'orange' : 'green'}
                        confirmText={`Wirklich auf dem ${props.file?.branch}-Branch ändern?`}
                    />
                </div>
            }
        >
            {alert && (
                <Alert type="danger" onDiscard={() => setAlert('')}>
                    {alert}
                </Alert>
            )}
            {isUpdate && (
                <div className={clsx(styles.pathInfo)}>
                    <small>
                        <span className={clsx(styles.label)}>Aktuell:</span>
                        <code>{props.file!.path}</code>
                    </small>
                    <small>
                        <span className={clsx(styles.label)}>Neu:</span>
                        <code>{resolvePath(props.file!.parentPath || '', name)}</code>
                    </small>
                </div>
            )}
            <TextInput onChange={setName} value={name} />
        </Card>
    );
});

export default AddOrUpdateFile;
