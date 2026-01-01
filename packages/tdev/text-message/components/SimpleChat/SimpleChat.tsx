import clsx from 'clsx';

import { observer } from 'mobx-react-lite';
import styles from './styles.module.scss';
import React from 'react';
import Conversation from './Conversation';
import NewMessage from './NewMessage';
import { default as SimpleChatModel } from '@tdev/text-message/models/SimpleChat';
import ChatName from './ChatName';

interface Props {
    simpleChat: SimpleChatModel;
    maxHeight?: string;
}

const SimpleChat = observer((props: Props): React.ReactNode => {
    const { simpleChat } = props;

    return (
        <div className={clsx(styles.simpleChat)}>
            <div className={clsx(styles.chat)}>
                <ChatName name={simpleChat.name} documentRootId={simpleChat.documentRootId} />
                <Conversation simpleChat={simpleChat} maxHeight={props.maxHeight} />
                <NewMessage simpleChat={simpleChat} />
            </div>
        </div>
    );
});
export default SimpleChat;
