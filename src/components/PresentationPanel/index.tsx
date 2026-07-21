import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import { useStore } from '@tdev-hooks/useStore';
import { CodeType } from '@tdev-api/document';
import type iCode from '@tdev-models/documents/iCode';
import Button from '@tdev-components/shared/Button';
import { mdiClose } from '@mdi/js';
import CodeEditorComponent from '@tdev-components/documents/CodeEditor';

interface Props {}

const PresentationPanel = observer((props: Props) => {
    const groupStore = useStore('studentGroupStore');
    const documentStore = useStore('documentStore');
    const viewStore = useStore('viewStore');
    const componentStore = useStore('componentStore');
    const doc = viewStore.presentedDocument as iCode<CodeType>;
    const EC = doc ? componentStore.editorComponent(doc.type as CodeType) : null;
    React.useEffect(() => {
        const rid = groupStore.managedStudentGroups[0]?.id;
        if (rid && doc?.isPresenting && !doc.isDummy) {
            console.log('join room', doc.documentRootId);
            documentStore.root.socketStore.joinRoom(rid);
        }
        return () => {
            if (rid) {
                documentStore.root.socketStore.leaveRoom(rid);
            }
        };
    }, [doc?.id]);
    if (!EC) {
        return <div>Kein Editor für Dokumenttyp {doc?.type}</div>;
    }

    return (
        <div className={clsx(styles.presentationMode)}>
            <Button icon={mdiClose} onClick={() => doc.setPresenting(false)} />
            <CodeEditorComponent code={doc} isPresentation />
        </div>
    );
});

export default PresentationPanel;
