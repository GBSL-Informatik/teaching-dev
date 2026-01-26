import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import React from 'react';
import { ModelMeta } from '@tdev/text-message/models/SimpleChat/ModelMeta';
import { useCreateDocument } from '@tdev-hooks/useCreateDocument';
import { useStore } from '@tdev-hooks/useStore';
import Button from '@tdev-components/shared/Button';
import { ApiState } from '@tdev-stores/iStore';
import ChatName from './ChatName';

interface Props {
    id: string;
    name: string;
    maxHeight?: string;
}

const CreateSimpleChat = observer((props: Props) => {
    const userStore = useStore('userStore');
    const [meta] = React.useState(new ModelMeta({ name: props.name }));
    const { create, apiState } = useCreateDocument(props.id, meta, true);
    if (!userStore.current?.hasElevatedAccess) {
        return null;
    }
    return (
        <div className={clsx(styles.simpleChatContainer)}>
            <ChatName name={props.name} documentRootId={props.id} />
            <Button
                onClick={create}
                spin={apiState === ApiState.SYNCING}
                disabled={apiState === ApiState.SYNCING}
                text="Neuer Chat erstellen"
            />
        </div>
    );
});
export default CreateSimpleChat;
