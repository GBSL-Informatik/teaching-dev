import { useStore } from '@tdev-hooks/useStore';
import File from '@tdev-models/documents/FileSystem/File';
import iCode from '@tdev-models/documents/iCode';
import { observer } from 'mobx-react-lite';
import { QuillV2Component } from '../../QuillV2';
import CodeEditorSelector from './CodeEditorSelector';
import styles from './styles.module.scss';

type Props =
    | {
          rootDirId: string;
          file?: undefined;
      }
    | {
          rootDirId?: undefined;
          file: File;
      };

const DocumentView = observer((props: Props) => {
    const componentStore = useStore('componentStore');
    const viewStore = useStore('viewStore');
    const file = props.file ?? viewStore.getSelectedFile(props.rootDirId);
    if (!file || !file.document) {
        return null;
    }
    const document = file.document;
    const editorKey = document.localObjectId;
    if (componentStore.documentViews.has(document.type)) {
        const Component = componentStore.documentViews.get(document.type)!;
        return <Component key={editorKey} document={document} />;
    }
    if (document.type === 'code') {
        return <CodeEditorSelector key={editorKey} code={document as iCode} />;
    }
    if (document.type === 'quill_v2') {
        return <QuillV2Component key={editorKey} quillDoc={document} className={styles.quill} />;
    }
    return null;
});

export default DocumentView;
