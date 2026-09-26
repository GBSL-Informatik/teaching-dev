import clsx from 'clsx';

import { default as SimpleChatModel } from '@tdev/text-message/models/SimpleChat';
import { observer } from 'mobx-react-lite';
import React from 'react';
import ChatName from './ChatName';
import Conversation from './Conversation';
import NewMessage from './NewMessage';
import styles from './styles.module.scss';

interface Props {
    documentContainer: SimpleChatModel;
    maxHeight?: string;
}

const SimpleChat = observer((props: Props): React.ReactNode => {
    const { documentContainer } = props;

    return (
        <div className={clsx(styles.simpleChat)}>
            <div className={clsx(styles.chat)}>
                <ChatName
                    name={documentContainer.name}
                    documentRootId={documentContainer.documentRootId}
                    simpleChat={documentContainer}
                />
                <Conversation
                    simpleChat={documentContainer}
                    maxHeight={documentContainer.maxHeight || props.maxHeight}
                />
                <NewMessage simpleChat={documentContainer} />
            </div>
        </div>
    );
});
export default SimpleChat;
