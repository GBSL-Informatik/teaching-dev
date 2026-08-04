import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import StudentGroup from '@tdev-models/StudentGroup';
import { CodeType } from '@tdev-api/document';
import CodeEditorComponent from '@tdev-components/documents/CodeEditor';
import iCode from '@tdev-models/documents/iCode';
import Alert from '@tdev-components/shared/Alert';
import { useStore } from '@tdev-hooks/useStore';

interface Props {
    group: StudentGroup;
}

const CodeEditor = observer((props: Props) => {
    const { group } = props;
    const componentStore = useStore('componentStore');
    if (!group.presentedDocument) {
        return <Alert type="warning">{group.name} hat keine aktive Präsentation</Alert>;
    }
    const docType = group.presentedDocument.type;
    const EC = componentStore.editorComponent(docType as CodeType);
    if (!EC) {
        return <Alert type="warning">Kein Editor für Dokumenttyp {docType}</Alert>;
    }
    return (
        <div className={clsx(styles.documentPresentationView)}>
            <CodeEditorComponent code={group.presentedDocument as iCode<CodeType>} isPresentation />
        </div>
    );
});

export default CodeEditor;
