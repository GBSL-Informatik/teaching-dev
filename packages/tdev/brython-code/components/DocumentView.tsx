import type * as CodeEditorLib from '@tdev-components/documents/CodeEditor';
import { useClientLib } from '@tdev-hooks/useClientLib';
import { observer } from 'mobx-react-lite';
import Script from '../models/Script';
interface Props {
    document: Script;
}

const DocumentView = observer((props: Props) => {
    const { document } = props;
    const Lib = useClientLib<typeof CodeEditorLib>(
        () => import('@tdev-components/documents/CodeEditor'),
        '@tdev-components/documents/CodeEditor'
    );
    if (!Lib) {
        return null;
    }
    return <Lib.default code={document} />;
});

export default DocumentView;
