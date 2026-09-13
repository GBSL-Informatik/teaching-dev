import { useFirstMainDocument } from '@tdev-hooks/useFirstMainDocument';
import { ModelMeta } from '@tdev/text-message/models/SimpleChat/ModelMeta';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import React from 'react';
import CreateSimpleChat from './CreateSimpleChat';
import { default as SimpleChatComponent } from './SimpleChat';
import styles from './styles.module.scss';

interface Props {
    id: string;
    name: string;
    maxHeight?: string;
}

const SimpleChat = observer((props: Props): React.ReactNode => {
    const { id, name } = props;
    const meta = React.useMemo(() => new ModelMeta({ name }), [id, name]);
    const simpleChat = useFirstMainDocument(id, meta, false);
    if (!simpleChat || simpleChat.isDummy) {
        return <CreateSimpleChat id={id} name={name} />;
    }

    return (
        <div className={clsx(styles.simpleChatContainer)}>
            <SimpleChatComponent documentContainer={simpleChat} maxHeight={props.maxHeight} />
        </div>
    );
});
export default SimpleChat;
