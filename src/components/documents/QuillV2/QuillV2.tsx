import { mdiFlashTriangle } from '@mdi/js';
import Icon from '@mdi/react';
import Loader from '@tdev-components/Loader';
import SyncStatus from '@tdev-components/SyncStatus';
import { useDocument } from '@tdev-hooks/useContextDocument';
import { MetaInit } from '@tdev-models/documents/QuillV2';
import { ToolbarOptions } from '@tdev-models/documents/QuillV2/helpers/toolbar';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import 'quill/dist/quill.bubble.css'; // Add css for snow theme
import 'quill/dist/quill.snow.css'; // Add css for snow theme
import React from 'react';
import { useQuill } from 'react-quilljs';
import './configureQuill';
import { useQuillBubbleMenu } from './hooks/useQuillBubbleMenu';
import { useQuillDocumentSync } from './hooks/useQuillDocumentSync';
import { useQuillImages } from './hooks/useQuillImages';
import { useQuillPermissions } from './hooks/useQuillPermissions';
import styles from './styles.module.scss';

const FORMATS = [
    'bold',
    'italic',
    'underline',
    'strike',
    'align',
    'list',
    'indent',
    'size',
    'header',
    'link',
    'image',
    'color',
    'background',
    'code-block',
    'indent',
    'blockquote',
    'script',
    'code'
    // 'width',
    // 'clean',
    // 'style',
    // 'video'
];

export interface Props extends MetaInit {
    id?: string;
    style?: React.CSSProperties;
    readonly?: boolean;
    monospace?: boolean;
    default?: string;
    toolbar?: ToolbarOptions;
    toolbarExtra?: ToolbarOptions;
    placeholder?: string;
    theme?: 'snow' | 'bubble';
    hideToolbar?: boolean;
    hideWarning?: boolean;
    className?: string;
}

const QuillV2 = observer((props: Props) => {
    const doc = useDocument<'quill_v2'>();
    const ref = React.useRef<HTMLDivElement>(null);
    const [theme] = React.useState(props.theme || 'snow');
    const { quill, quillRef } = useQuill({
        theme: theme,
        modules: {
            toolbar: doc.meta.toolbar,
            imageResize: {
                handleStyles: {
                    borderRadius: '50%'
                }
            }
        },
        formats: FORMATS,
        placeholder: props.placeholder || '✍️ Antwort...',
        readOnly: !doc.canEdit || props.readonly
    });

    useQuillDocumentSync(doc, quill);
    useQuillPermissions(doc, quill, props.readonly);
    useQuillBubbleMenu(quill, ref, theme);
    const processingImage = useQuillImages(quill);

    return (
        <div className={clsx(styles.quillEditor, styles.quill, 'notranslate', props.className)} ref={ref}>
            <div
                className={clsx(
                    'quill-editor-container',
                    styles.quillAnswer,
                    doc.root?.isDummy && !props.hideWarning && styles.dummy,
                    props.monospace && styles.monospace,
                    (props.hideToolbar || !doc?.canEdit || props.readonly) && styles.hideToolbar
                )}
                style={{
                    ...(props.style || {})
                }}
            >
                {doc.root?.isDummy && !props.hideWarning && (
                    <Icon
                        path={mdiFlashTriangle}
                        size={0.7}
                        color="orange"
                        title="Wird nicht gespeichert."
                        className={styles.dummyIndicatorIcon}
                    />
                )}
                {doc.isInitialized ? (
                    <div ref={quillRef} />
                ) : (
                    <div className={styles.loaderContainer}>
                        <Loader label="Laden..." overlay className={styles.loader} />
                    </div>
                )}
                {processingImage && <Loader label="Bild Einfügen..." overlay />}
                <SyncStatus model={doc} className={styles.saveIndicator} />
            </div>
        </div>
    );
});

export default QuillV2;
