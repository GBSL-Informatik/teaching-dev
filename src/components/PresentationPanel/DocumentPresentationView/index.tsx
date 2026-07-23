import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import { useStore } from '@tdev-hooks/useStore';
import StudentGroup from '@tdev-models/StudentGroup';
import { CodeType } from '@tdev-api/document';
import CodeEditorComponent from '@tdev-components/documents/CodeEditor';
import iCode from '@tdev-models/documents/iCode';

interface Props {
    group: StudentGroup;
}

const DocumentPresentationView = observer((props: Props) => {
    const componentStore = useStore('componentStore');
    const { group } = props;
    if (!group.presentedDocument) {
        return <div>Keine Präsentation</div>;
    }
    const docType = group.presentedDocument.type;
    const EC = componentStore.editorComponent(docType as CodeType);
    if (!EC) {
        return <div>Kein Editor für Dokumenttyp {docType}</div>;
    }

    return (
        <div className={clsx(styles.DocumentPresentationView)}>
            <CodeEditorComponent code={group.presentedDocument as iCode<CodeType>} isPresentation />
        </div>
    );
});

export default DocumentPresentationView;
