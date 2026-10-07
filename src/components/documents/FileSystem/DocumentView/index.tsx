import { useStore } from '@tdev-hooks/useStore';
import Directory from '@tdev-models/documents/FileSystem/Directory';
import iCode from '@tdev-models/documents/iCode';
import { observer } from 'mobx-react-lite';
import { QuillV2Component } from '../../QuillV2';
import CodeEditorSelector from './CodeEditorSelector';
import styles from './styles.module.scss';

interface Props {
    dir: Directory;
}

const DocumentView = observer((props: Props) => {
    const { dir } = props;
    const componentStore = useStore('componentStore');
    if (dir.selectedFiles.length === 0) {
        return null;
    }
    const { document } = dir.selectedFiles[0];
    if (componentStore.documentViews.has(document.type)) {
        const Component = componentStore.documentViews.get(document.type)!;
        return <Component document={document} />;
    }
    if (document.type === 'code') {
        return <CodeEditorSelector code={document as iCode} />;
    }
    if (document.type === 'quill_v2') {
        return <QuillV2Component quillDoc={document} className={styles.quill} />;
    }
    return null;
});

export default DocumentView;
