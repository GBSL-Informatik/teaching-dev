import EditDataProps from '@tdev-components/documents/DynamicDocumentRoots/EditDataProps';
import PermissionsPanel from '@tdev-components/PermissionsPanel';
import SimpleChat from '@tdev/text-message/models/SimpleChat';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import ClearHistory from './ClearHistory';
import styles from './styles.module.scss';

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
                {simpleChat?.hasAdminAccess && <EditDataProps docContainer={simpleChat} />}
                <PermissionsPanel documentRootId={documentRootId} />
            </div>
        </h1>
    );
});

export default ChatName;
