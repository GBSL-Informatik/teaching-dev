import useIsBrowser from '@docusaurus/useIsBrowser';
import { observer } from 'mobx-react-lite';
import * as React from 'react';
import type { default as QuillV2Type, Props } from './QuillV2';
import { default as QuillV2Model, ModelMeta } from '@tdev-models/documents/QuillV2';
import { DocContext } from '@tdev-components/documents/DocumentContext';
import Loader from '@tdev-components/Loader';
import { useFirstRealMainDocument } from '@tdev-hooks/useFirstRealMainDocument';

/**
 * Lazy load QuillV2 component - this is a workaround for SSR
 * Background: QuillV2 uses react-quilljs which uses Quill.js which uses window.document
 * which is not available in SSR
 *
 * --> dynamic import QuillV2 component when it's needed
 */

export const QuillV2 = observer((props: Props) => {
    const doc = useFirstRealMainDocument(props.id, new ModelMeta(props));
    /**
     * if the user is logged in but the document is not loaded yet, show a loader.
     * This prevents quill from rendering before the document is loaded
     * (which leads to react quill using the wrong quill instance)
     */
    if (!doc) {
        return <Loader />;
    }
    return <QuillV2Component quillDoc={doc} {...props} />;
});

type QuillProps = Props & {
    quillDoc: QuillV2Model;
    className?: string;
};

export const QuillV2Component = observer((props: QuillProps) => {
    const [quill, setQuill] = React.useState<{ default: typeof QuillV2Type }>();
    const { quillDoc } = props;
    const isBrowser = useIsBrowser();
    React.useEffect(() => {
        import('./QuillV2').then((quill) => {
            setQuill(quill);
        });
    }, []);
    if (!isBrowser || !quill || !quillDoc) {
        return <div>{quillDoc.meta.default || quillDoc.meta.placeholder || '✍️ Antwort...'}</div>;
    }

    return (
        <DocContext.Provider value={quillDoc}>
            <quill.default {...props} />
        </DocContext.Provider>
    );
});

export default QuillV2;
