import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import { default as TextMessageModel } from '@tdev-models/Messages/Text';
import { mdiSend } from '@mdi/js';
import { useStore } from '@tdev-hooks/useStore';
import Button from '@tdev-components/shared/Button';
import { MessageType } from '@tdev-models/Messages/iMessage';

interface Props {
    room: string;
}

const NewMessage = observer((props: Props) => {
    const [message, setMessage] = React.useState('');
    const userStore = useStore('userStore');
    const userMessageStore = useStore('userMessageStore');
    const sendMessage = () => {
        if (!userStore.current || message.trim() === '') {
            return;
        }
        const msg = new TextMessageModel(
            {
                type: MessageType.Text,
                data: {
                    text: message
                },
                senderId: userStore.current.id,
                room: props.room
            },
            userMessageStore
        );
        msg.deliver();
        setMessage('');
    };
    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            sendMessage();
        }
    };
    return (
        <div className={clsx(styles.message)}>
            <input
                name="message"
                type="search"
                autoFocus
                autoComplete="off"
                spellCheck={false}
                value={message}
                className={clsx(styles.input)}
                placeholder="Neue Nachricht"
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
            />
            <Button icon={mdiSend} onClick={sendMessage} className={clsx(styles.button)} size={1.1} />
        </div>
    );
});

export default NewMessage;
