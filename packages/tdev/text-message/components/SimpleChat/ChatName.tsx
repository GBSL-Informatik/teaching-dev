import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import SimpleChat from '@tdev/text-message/models/SimpleChat';
import PermissionsPanel from '@tdev-components/PermissionsPanel';
import ClearHistory from './ClearHistory';
import Button from '@tdev-components/shared/Button';
import { mdiCircleEditOutline } from '@mdi/js';
import TextInput from '@tdev-components/shared/TextInput';
import { Source } from '@tdev-models/iDocument';

interface Props {
    name: string;
    documentRootId: string;
    simpleChat?: SimpleChat;
}

const ChatName = observer((props: Props) => {
    const { name, documentRootId, simpleChat } = props;
    const [edit, setEdit] = React.useState(false);
    return (
        <h1 className={clsx(styles.name)}>
            {edit ? (
                <TextInput
                    value={simpleChat?.name || ''}
                    onChange={(name) => {
                        if (simpleChat) {
                            simpleChat.setName(name);
                        }
                    }}
                    onEnter={() => {
                        simpleChat?.saveNow();
                        setEdit(false);
                    }}
                    onSave={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        simpleChat?.saveNow();
                        setEdit(false);
                    }}
                />
            ) : (
                name
            )}
            <div className={clsx(styles.actions)}>
                {simpleChat && <ClearHistory simpleChat={simpleChat} />}
                {simpleChat?.hasAdminAccess && (
                    <Button
                        icon={mdiCircleEditOutline}
                        color="orange"
                        onClick={() => {
                            setEdit(true);
                        }}
                    />
                )}
                <PermissionsPanel documentRootId={documentRootId} />
            </div>
        </h1>
    );
});

export default ChatName;
