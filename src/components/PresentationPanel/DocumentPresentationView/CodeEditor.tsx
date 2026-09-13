import { CodeType } from '@tdev-api/document';
import Loader from '@tdev-components/Loader';
import CodeEditorComponent from '@tdev-components/documents/CodeEditor';
import { type Overrides } from '@tdev-components/documents/CodeEditor/Editor/EditorAce';
import Alert from '@tdev-components/shared/Alert';
import { useStore } from '@tdev-hooks/useStore';
import StudentGroup from '@tdev-models/StudentGroup';
import iCode from '@tdev-models/documents/iCode';
import CodeBlock from '@theme/CodeBlock';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import React from 'react';
import styles from './styles.module.scss';

interface Props {
    group: StudentGroup;
}

const EditorOverrides: Overrides = {
    maxLines: 45
};

const CodeEditor = observer((props: Props) => {
    const { group } = props;
    const componentStore = useStore('componentStore');
    const viewStore = useStore('viewStore');
    const overrides: Overrides = React.useMemo(() => {
        if (viewStore.isPresentedEditorZoomed) {
            return {
                ...EditorOverrides,
                fontSize: '120%'
            };
        }
        return EditorOverrides;
    }, [viewStore.isPresentedEditorZoomed]);
    if (!group.presentedDocument) {
        return <Alert type="warning">{group.name} hat keine aktive Präsentation</Alert>;
    }
    const docType = group.presentedDocument.type;
    const EC = componentStore.editorComponent(docType as CodeType);
    if (!EC) {
        return <Alert type="warning">Kein Editor für Dokumenttyp {docType}</Alert>;
    }
    if (group.isPresentedDocumentStale) {
        return (
            <div className={clsx(styles.documentPresentationView)}>
                <Loader label="Warten auf aktuelle Version..." />
                <CodeBlock language={(group.presentedDocument as iCode<CodeType>).lang}>
                    {(group.presentedDocument as iCode<CodeType>).code}
                </CodeBlock>
            </div>
        );
    }
    return (
        <div className={clsx(styles.documentPresentationView)}>
            <CodeEditorComponent
                code={group.presentedDocument as iCode<CodeType>}
                isPresentation
                overrides={overrides}
            />
        </div>
    );
});

export default CodeEditor;
