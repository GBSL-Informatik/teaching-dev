import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import { mdiSend } from '@mdi/js';
import Button from '@tdev-components/shared/Button';
import SimpleChat from '@tdev/text-message/models/SimpleChat';
import TextInput from '@tdev-components/shared/TextInput';

interface Props {
    simpleChat: SimpleChat;
}

const NewMessage = observer((props: Props) => {
    const { simpleChat } = props;
    return (
        <div className={clsx(styles.message)}>
            <TextInput
                onChange={(text) => simpleChat.setMessageText(text)}
                value={simpleChat.messageText}
                placeholder={simpleChat.canWrite ? 'Neue Nachricht' : 'Keine Schreibrechte'}
                readOnly={!simpleChat.canWrite}
                onEnter={() => simpleChat.sendMessage()}
                className={clsx(styles.input)}
            />
            <Button
                icon={mdiSend}
                onClick={() => simpleChat.sendMessage()}
                className={clsx(styles.button)}
                size={1.1}
                disabled={!simpleChat.canWrite || simpleChat.messageText.trim() === ''}
            />
        </div>
    );
});

export default NewMessage;
