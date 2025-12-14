import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import TextMessage from '..';
import DocumentRoot from '@tdev-models/DocumentRoot';
import { DocumentType } from '@tdev-api/document';

interface Props {
    group: DocumentRoot<'dynamic_document_root'>;
}

const Conversation = observer((props: Props) => {
    const { group } = props;
    const ref = React.useRef<HTMLDivElement>(null);
    React.useEffect(() => {
        if (ref.current) {
            ref.current.scrollTo({ behavior: 'smooth', top: ref.current.scrollHeight });
        }
    }, [ref, group.allDocuments.length]);
    return (
        <div className={clsx(styles.conversation)} ref={ref}>
            {group.allDocuments
                .filter((msg) => msg.type === 'text_message')
                .map((message, index) => {
                    return <TextMessage key={index} message={message} />;
                })}
        </div>
    );
});

export default Conversation;
