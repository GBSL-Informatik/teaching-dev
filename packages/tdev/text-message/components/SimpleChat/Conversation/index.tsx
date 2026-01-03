import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import TextMessage from '../../TextMessage';
import { default as SimpleChatModel } from '@tdev/text-message/models/SimpleChat';

interface Props {
    simpleChat: SimpleChatModel;
    maxHeight?: string;
}

const Conversation = observer((props: Props) => {
    const { simpleChat } = props;
    const ref = React.useRef<HTMLDivElement>(null);
    React.useEffect(() => {
        if (ref.current) {
            ref.current.scrollTo({ behavior: 'smooth', top: ref.current.scrollHeight });
        }
    }, [ref, simpleChat.messages.length]);
    if (!simpleChat.canRead) {
        return null;
    }
    return (
        <div className={clsx(styles.conversation)} style={{ maxHeight: props.maxHeight }} ref={ref}>
            {simpleChat.messages.map((message, index) => {
                return <TextMessage key={index} message={message} />;
            })}
        </div>
    );
});

export default Conversation;
