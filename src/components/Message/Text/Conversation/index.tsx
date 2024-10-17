import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import { useFirstMainDocument } from '@tdev-hooks/useFirstMainDocument';
import Loader from '@tdev-components/Loader';
import Icon from '@mdi/react';
import { mdiClose } from '@mdi/js';
import { useStore } from '@tdev-hooks/useStore';
import TextMessage from '..';
import { MessageType } from '@tdev-models/Messages/iMessage';
import { default as TextMessageModel } from '@tdev-models/Messages/Text';

interface Props {
    room: string;
}

const Conversation = observer((props: Props) => {
    const userMessageStore = useStore('userMessageStore');
    return (
        <div className={clsx(styles.conversation)}>
            {userMessageStore.messages
                .get(props.room)
                ?.filter((msg) => msg.type === MessageType.Text)
                .map((message, index) => {
                    return <TextMessage key={index} message={message as TextMessageModel} />;
                })}
        </div>
    );
});

export default Conversation;
