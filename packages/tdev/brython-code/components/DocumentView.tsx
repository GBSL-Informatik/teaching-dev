// import type * as CodeEditorLib from '@tdev-components/documents/CodeEditor';
import type * as CodeEditorSelectorLib from '@tdev-components/documents/FileSystem/DocumentView/CodeEditorSelector';
import { useClientLib } from '@tdev-hooks/useClientLib';
import type iCode from '@tdev-models/documents/iCode';
import { observer } from 'mobx-react-lite';
import Script from '../models/Script';
interface Props {
    document: Script;
}

const DocumentView = observer((props: Props) => {
    const { document } = props;
    // legacy reason: we need to use `CodeEditorSelector` for code documents, because the might render as generig code editors.
    // const Lib = useClientLib<typeof CodeEditorLib>(
    //     () => import('@tdev-components/documents/CodeEditor'),
    //     '@tdev-components/documents/CodeEditor'
    // );
    const Lib = useClientLib<typeof CodeEditorSelectorLib>(
        () => import('@tdev-components/documents/FileSystem/DocumentView/CodeEditorSelector'),
        '@tdev-components/documents/FileSystem/DocumentView/CodeEditorSelector'
    );

    if (!Lib) {
        return null;
    }
    return <Lib.default code={document as iCode} />;
});

export default DocumentView;
