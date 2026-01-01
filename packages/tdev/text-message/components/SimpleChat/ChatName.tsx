import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import { useStore } from '@tdev-hooks/useStore';
import SimpleChat from '@tdev/text-message/models/SimpleChat';
import PermissionsPanel from '@tdev-components/PermissionsPanel';

interface Props {
    name: string;
    documentRootId: string;
}

const ChatName = observer((props: Props) => {
    const { name, documentRootId } = props;
    return (
        <h1 className={clsx(styles.name)}>
            {name} <PermissionsPanel documentRootId={documentRootId} />
        </h1>
    );
});

export default ChatName;
