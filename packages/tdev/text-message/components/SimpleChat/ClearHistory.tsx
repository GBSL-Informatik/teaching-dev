import { observer } from 'mobx-react-lite';
import React from 'react';
import { useStore } from '@tdev-hooks/useStore';
import { Delete } from '@tdev-components/shared/Button/Delete';
import { mdiChatRemove } from '@mdi/js';
import SimpleChat from '@tdev/text-message/models/SimpleChat';
import { action } from 'mobx';

interface Props {
    simpleChat: SimpleChat;
}

const ClearHistory = observer((props: Props) => {
    const userStore = useStore('userStore');
    if (!userStore.current?.hasElevatedAccess) {
        return null;
    }
    return (
        <Delete
            onDelete={action(() => {
                props.simpleChat.clearHistory();
            })}
            text="Verlauf löschen"
            icon={mdiChatRemove}
        />
    );
});
export default ClearHistory;
