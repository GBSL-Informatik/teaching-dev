import CodeEditorComponent from '@tdev-components/documents/CodeEditor';
import { observer } from 'mobx-react-lite';
import PyodideCode from '../models/PyodideCode';

interface Props {
    document: PyodideCode;
}

const DocumentView = observer((props: Props) => {
    const { document } = props;
    return <CodeEditorComponent code={document} />;
});

export default DocumentView;
