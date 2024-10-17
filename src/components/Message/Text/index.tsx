import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import { useFirstMainDocument } from '@tdev-hooks/useFirstMainDocument';
import Loader from '@tdev-components/Loader';
import { default as TextMessageModel } from '@tdev-models/Messages/Text';
import Icon from '@mdi/react';
import { mdiClose } from '@mdi/js';

interface Props {
    message: TextMessageModel;
    canDelete?: boolean;
}

const TextMessage = observer((props: Props) => {
    const { message } = props;
    return (
        <div className={clsx('alert alert--primary', styles.message)} role="alert">
            {props.canDelete && (
                <button aria-label="Close" className="clean-btn close" type="button" onClick={() => {}}>
                    <span aria-hidden="true">
                        <Icon path={mdiClose} size={1} />
                    </span>
                </button>
            )}
            {message.text}
            <small>
                <span
                    className={clsx('badge badge--secondary')}
                    title={message.deliveredAt?.toISOString().replace('T', ' ').replace('Z', '')}
                >
                    {message.sentToday
                        ? message.deliveredAt?.toLocaleTimeString().slice(0, -3)
                        : message.deliveredAt?.toLocaleString()}
                </span>
                <span className={clsx('badge badge--primary')}>
                    {message.author?.nameShort || message.senderId}
                </span>
            </small>
        </div>
    );
});

export default TextMessage;
