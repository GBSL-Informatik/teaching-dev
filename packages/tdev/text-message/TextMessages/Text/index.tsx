import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import { default as TextMessageModel } from '@tdev-models/documents/TextMessage';
import Icon from '@mdi/react';
import { mdiClose } from '@mdi/js';

interface Props {
    message: TextMessageModel;
    canDelete?: boolean;
}

const TextMessage = observer((props: Props) => {
    const { message } = props;
    return (
        <div
            className={clsx('alert', message.isAuthor ? 'alert--primary' : 'alert--info', styles.message)}
            role="alert"
        >
            {props.canDelete && (
                <button aria-label="Close" className="clean-btn close" type="button" onClick={() => {}}>
                    <span aria-hidden="true">
                        <Icon path={mdiClose} size={1} />
                    </span>
                </button>
            )}
            <div className={clsx(styles.content)}>{message.text}</div>
            <small>
                <span
                    className={clsx('badge badge--secondary')}
                    title={message.createdAt.toISOString().replace('T', ' ').replace('Z', '')}
                >
                    {message.sentToday
                        ? message.createdAt?.toLocaleTimeString().slice(0, -3)
                        : message.createdAt?.toLocaleString()}
                </span>
                <span className={clsx('badge badge--primary')}>
                    {message.author?.nameShort || message.authorId}
                </span>
            </small>
        </div>
    );
});

export default TextMessage;
