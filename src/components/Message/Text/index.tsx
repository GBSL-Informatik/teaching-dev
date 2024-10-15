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
}

const TextMessage = observer((props: Props) => {
    const { message } = props;
    return (
        <div className="alert alert--primary" role="alert">
            <button aria-label="Close" className="clean-btn close" type="button" onClick={() => {}}>
                <span aria-hidden="true">
                    <Icon path={mdiClose} size={1} />
                </span>
            </button>
            {message.text}
            <small>
                {message.createdAt.toLocaleString()}
                {message.author?.nameShort || message.senderId}
            </small>
        </div>
    );
});

export default TextMessage;
