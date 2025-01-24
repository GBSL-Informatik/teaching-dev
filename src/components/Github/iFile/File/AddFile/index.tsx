import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import { useStore } from '@tdev-hooks/useStore';
import Card from '@tdev-components/shared/Card';
import TextInput from '@tdev-components/shared/TextInput';
import Button from '@tdev-components/shared/Button';
import { mdiClose, mdiFilePlus, mdiLoading } from '@mdi/js';
import { ApiState } from '@tdev-stores/iStore';
import Alert from '@tdev-components/shared/Alert';

export type Response = { state: ApiState; message?: string };

interface Props {
    onDiscard: () => void;
    onCreate: (path: string) => Promise<Response>;
}

const AddFile = observer((props: Props) => {
    const [alert, setAlert] = React.useState('');
    const [name, setName] = React.useState('');
    const [apiState, setApiState] = React.useState(ApiState.IDLE);

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
                    />
                    <Button
                        text="Datei erstellen"
                        icon={apiState === ApiState.SYNCING ? mdiLoading : mdiFilePlus}
                        spin={apiState === ApiState.SYNCING}
                        onClick={() => {
                            setApiState(ApiState.SYNCING);
                            props.onCreate(name).then((res) => {
                                if (res.state === 'error') {
                                    setAlert(res.message || '');
                                    setApiState(ApiState.IDLE);
                                }
                            });
                        }}
                        disabled={!name || apiState !== ApiState.IDLE}
                        color="green"
                    />
                </div>
            }
        >
            {alert && (
                <Alert type="danger" onDiscard={() => setAlert('')}>
                    {alert}
                </Alert>
            )}
            <TextInput onChange={setName} value={name} />
        </Card>
    );
});

export default AddFile;
