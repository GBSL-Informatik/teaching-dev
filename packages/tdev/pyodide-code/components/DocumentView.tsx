import type * as CodeEditorLib from '@tdev-components/documents/CodeEditor';
import { useClientLib } from '@tdev-hooks/useClientLib';
import { observer } from 'mobx-react-lite';
import PyodideCode from '../models/PyodideCode';
interface Props {
    document: PyodideCode;
}

const importStatement = () => import('@tdev-components/documents/CodeEditor');

const DocumentView = observer((props: Props) => {
    const { document } = props;
    const Lib = useClientLib<typeof CodeEditorLib>(importStatement, '@tdev-components/documents/CodeEditor');
    if (!Lib) {
        return null;
    }
    return <Lib.default code={document} />;
});

export default DocumentView;
