import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import { mdiSend } from '@mdi/js';
import { useStore } from '@tdev-hooks/useStore';
import Button from '@tdev-components/shared/Button';
import DocumentRoot from '@tdev-models/DocumentRoot';
import { DocumentType } from '@tdev-api/document';

interface Props {
    group: DocumentRoot<'dynamic_document_root'>;
}

const NewMessage = observer((props: Props) => {
    const { group } = props;
    const [message, setMessage] = React.useState('');
    const userStore = useStore('userStore');
    const documentStore = useStore('documentStore');
    const sendMessage = () => {
        if (!userStore.current || message.trim() === '') {
            return;
        }
        documentStore
            .create({
                documentRootId: group.id,
                type: 'text_message',
                data: {
                    text: message
                }
            })
            .then((msg) => {
                if (msg) {
                    setMessage('');
                }
            });
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
                disabled={!group.hasRWAccess}
            />
            <Button
                icon={mdiSend}
                onClick={sendMessage}
                className={clsx(styles.button)}
                size={1.1}
                disabled={!group.hasRWAccess}
            />
        </div>
    );
});

export default NewMessage;
