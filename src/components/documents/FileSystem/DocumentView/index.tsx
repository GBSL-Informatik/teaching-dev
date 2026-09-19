import React from 'react';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import { QuillV2Component } from '../../QuillV2';
import { ExcalidocComponent } from '@tdev/excalidoc/Component';
import CodeEditorSelector from './CodeEditorSelector';
import iCode from '@tdev-models/documents/iCode';
import { DocumentModelType } from '@tdev-api/document';

interface Props {
    document?: DocumentModelType;
}

const DocumentView = observer((props: Props) => {
    const { document } = props;
    if (!document) {
        return null;
    }
    if (document.type === 'script' || document.type === 'pyodide_code' || document.type === 'code') {
        return <CodeEditorSelector code={document as iCode} />;
    }
    if (document.type === 'quill_v2') {
        return <QuillV2Component quillDoc={document} className={styles.quill} />;
    }
    if (document.type === 'excalidoc') {
        return <ExcalidocComponent documentId={document.id} height="80vh" allowImageInsertion />;
    }
    return null;
});

export default DocumentView;
