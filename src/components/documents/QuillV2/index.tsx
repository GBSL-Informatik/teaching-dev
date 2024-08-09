import useIsBrowser from '@docusaurus/useIsBrowser';
import { observer } from 'mobx-react-lite';
import * as React from 'react';
import type { default as QuillV2Type, Props } from './QuillV2';
import { ModelMeta } from '@site/src/models/documents/QuillV2';
import { useFirstMainDocument } from '@site/src/hooks/useFirstMainDocument';

/**
 * Lazy load QuillV2 component - this is a workaround for SSR
 * Background: QuillV2 uses react-quilljs which uses Quill.js which uses window.document
 * which is not available in SSR
 *
 * --> dynamic import QuillV2 component when it's needed
 */
const QuillV2 = observer((props: Omit<Props, 'quillDocument'>) => {
    const [quill, setQuill] = React.useState<{ default: typeof QuillV2Type }>();
    const [meta] = React.useState(new ModelMeta(props));
    const doc = useFirstMainDocument(props.id, meta);
    React.useEffect(() => {
        import('./QuillV2').then((quill) => {
            setQuill(quill);
        });
    }, []);
    if (doc) {
    }
    if (!useIsBrowser() || !doc || !quill) {
        return <div>{props.default || props.placeholder || '✍️ Antwort...'}</div>;
    }
    return <quill.default {...props} quillDocument={doc} />;
});

export default QuillV2;
