import clsx from 'clsx';

import { observer } from 'mobx-react-lite';
import styles from './styles.module.scss';
import React from 'react';
import Conversation from './Conversation';
import NewMessage from './NewMessage';
import { default as SimpleChatModel } from '@tdev/text-message/models/SimpleChat';
import ChatName from './ChatName';

interface Props {
    documentContainer: SimpleChatModel;
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
                <Conversation simpleChat={documentContainer} maxHeight={'300px' /*props.maxHeight*/} />
                <NewMessage simpleChat={documentContainer} />
            </div>
        </div>
    );
});
export default SimpleChat;
