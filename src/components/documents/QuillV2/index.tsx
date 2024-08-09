import useIsBrowser from '@docusaurus/useIsBrowser';
import { observer } from 'mobx-react-lite';
import * as React from 'react';
import type { default as QuillV2Type, Props } from './QuillV2';

/**
 * Lazy load QuillV2 component - this is a workaround for SSR
 * Background: QuillV2 uses react-quilljs which uses Quill.js which uses window.document
 * which is not available in SSR
 *
 * --> dynamic import QuillV2 component when it's needed
 */
const QuillV2 = observer((props: Omit<Props, 'quillDocument'>) => {
    const [quill, setQuill] = React.useState<{ default: typeof QuillV2Type }>();
    React.useEffect(() => {
        import('./QuillV2').then((quill) => {
            setQuill(quill);
        });
    }, []);
    if (!useIsBrowser() || !quill) {
        return <div>{props.default || props.placeholder || '✍️ Antwort...'}</div>;
    }
    return <quill.default {...props} />;
});

export default QuillV2;
