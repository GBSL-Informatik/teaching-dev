import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import React from 'react';
import { ModelMeta } from '@tdev/text-message/models/SimpleChat/ModelMeta';
import { default as SimpleChatComponent } from './SimpleChat';
import { useFirstMainDocument } from '@tdev-hooks/useFirstMainDocument';
import CreateSimpleChat from './CreateSimpleChat';

interface Props {
    id: string;
    name: string;
    maxHeight?: string;
}

const SimpleChat = observer((props: Props): React.ReactNode => {
    const { id, name } = props;
    const [meta] = React.useState(new ModelMeta({ name }));
    const simpleChat = useFirstMainDocument(id, meta, false);
    if (!simpleChat || simpleChat.isDummy) {
        return <CreateSimpleChat id={id} name={name} />;
    }

    return (
        <div className={clsx(styles.simpleChatContainer)}>
            <SimpleChatComponent simpleChat={simpleChat} maxHeight={props.maxHeight} />
        </div>
    );
});
export default SimpleChat;
