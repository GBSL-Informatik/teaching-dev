import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import SimpleChat from '@tdev/text-message/models/SimpleChat';
import PermissionsPanel from '@tdev-components/PermissionsPanel';
import ClearHistory from './ClearHistory';

interface Props {
    name: string;
    documentRootId: string;
    simpleChat?: SimpleChat;
}

const ChatName = observer((props: Props) => {
    const { name, documentRootId, simpleChat } = props;
    return (
        <h1 className={clsx(styles.name)}>
            {name}
            <div className={clsx(styles.actions)}>
                {simpleChat && <ClearHistory simpleChat={simpleChat} />}
                <PermissionsPanel documentRootId={documentRootId} />
            </div>
        </h1>
    );
});

export default ChatName;
