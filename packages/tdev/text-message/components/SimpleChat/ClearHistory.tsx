import { observer } from 'mobx-react-lite';
import React from 'react';
import { Delete } from '@tdev-components/shared/Button/Delete';
import { mdiChatRemove } from '@mdi/js';
import SimpleChat from '@tdev/text-message/models/SimpleChat';
import { action } from 'mobx';

interface Props {
    simpleChat: SimpleChat;
}

const ClearHistory = observer((props: Props) => {
    if (!props.simpleChat.hasAdminAccess) {
        return null;
    }
    return (
        <Delete
            onDelete={action(() => {
                props.simpleChat.clearHistory();
            })}
            title="Chat löschen"
            text={''}
            confirmMessage="Chat wirklich löschen?"
            icon={mdiChatRemove}
        />
    );
});
export default ClearHistory;
