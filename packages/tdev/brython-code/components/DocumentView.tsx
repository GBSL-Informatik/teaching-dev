import type * as CodeEditorSelectorLib from '@tdev-components/documents/FileSystem/DocumentView/CodeEditorSelector';
import { useClientLib } from '@tdev-hooks/useClientLib';
import { observer } from 'mobx-react-lite';
import Script from '../models/Script';

interface Props {
    document: Script;
}

const DocumentView = observer((props: Props) => {
    const { document } = props;
    // Legacy script documents can contain HTML or SVG.
    const Lib = useClientLib<typeof CodeEditorSelectorLib>(
        () => import('@tdev-components/documents/FileSystem/DocumentView/CodeEditorSelector'),
        '@tdev-components/documents/FileSystem/DocumentView/CodeEditorSelector'
    );

    if (!Lib) {
        return null;
    }
    return <Lib.default code={document} />;
});

export default DocumentView;
