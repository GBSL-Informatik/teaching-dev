import clsx from 'clsx';

import { observer } from 'mobx-react-lite';
import styles from './styles.module.scss';
import React from 'react';
import PermissionsPanel from '@tdev-components/PermissionsPanel';
import { DocumentType, DynamicDocumentRoot } from '@tdev-api/document';
import DocumentRoot from '@tdev-models/DocumentRoot';
import Conversation from './Text/Conversation';
import NewMessage from './Text/NewMessage';

interface Props {
    roomProps: DynamicDocumentRoot;
    documentRoot: DocumentRoot<'dynamic_document_root'>;
}

const TextMessages = observer((props: Props): React.ReactNode => {
    const { documentRoot, roomProps: dynamicDocumentRoot } = props;
    if (documentRoot.id !== dynamicDocumentRoot.id) {
        return <></>;
    }

    return (
        <div className={clsx(styles.wrapper)}>
            <div className={clsx(styles.rooms)}>
                <h1 className={clsx(styles.name)}>
                    {dynamicDocumentRoot.name} <PermissionsPanel documentRootId={documentRoot.id} />
                </h1>
                <Conversation group={documentRoot} />
                <NewMessage group={documentRoot} />
            </div>
        </div>
    );
});
export default TextMessages;
