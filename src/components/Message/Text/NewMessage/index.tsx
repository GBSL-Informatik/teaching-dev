import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import { useFirstMainDocument } from '@tdev-hooks/useFirstMainDocument';
import Loader from '@tdev-components/Loader';
import { default as TextMessageModel } from '@tdev-models/Messages/Text';
import Icon from '@mdi/react';
import { mdiClose, mdiSend } from '@mdi/js';
import { useStore } from '@tdev-hooks/useStore';
import Button from '@tdev-components/shared/Button';
import { MessageType } from '@tdev-models/Messages/iMessage';

const NewMessage = observer(() => {
    const [message, setMessage] = React.useState('');
    const userStore = useStore('userStore');
    const userMessageStore = useStore('userMessageStore');
    const sendMessage = () => {
        if (!userStore.current) {
            return;
        }
        const msg = new TextMessageModel(
            {
                type: MessageType.Text,
                data: {
                    text: message
                },
                senderId: userStore.current.id,
                room: 'foo'
            },
            userMessageStore
        );
        userMessageStore.sendMessage(msg);
        setMessage('');
    };
    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.ctrlKey || event.metaKey) {
            if (event.key === 'Enter') {
                event.preventDefault();
                sendMessage();
            }
        }
    };
    return (
        <div className={clsx(styles.message)}>
            <input
                name="message"
                type={'text'}
                spellCheck={false}
                value={message}
                className={clsx(styles.input)}
                placeholder="Neue Nachricht"
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
            />
            <Button icon={mdiSend} onClick={sendMessage} />
        </div>
    );
});

export default NewMessage;
