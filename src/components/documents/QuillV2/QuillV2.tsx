import React from 'react';
import { observer } from 'mobx-react-lite';
import Loader from '@tdev-components/Loader';
import { MetaInit } from '@tdev-models/documents/QuillV2';
import { useQuill } from 'react-quilljs';
import { ToolbarOptions } from '@tdev-models/documents/QuillV2/helpers/toolbar';
import 'quill/dist/quill.snow.css'; // Add css for snow theme
import 'quill/dist/quill.bubble.css'; // Add css for snow theme
import BaseImageFormat from 'quill/formats/image';
import { downscaleImage } from './quill-img-compress/downscaleImage';
import ImageResize from './quill-img-resize';
import { file2b64 } from './quill-img-compress/file2b64';
import dropImage from './quill-img-compress/dropImage';
import pasteImage from './quill-img-compress/pasteImage';
import styles from './styles.module.scss';
import clsx from 'clsx';
import SyncStatus from '@tdev-components/SyncStatus';
import { action } from 'mobx';
import Icon from '@mdi/react';
import { mdiFlashTriangle } from '@mdi/js';
import { useDocument } from '@tdev-hooks/useContextDocument';
import { DocumentType } from '@tdev-api/document';
import { Delta } from 'quill/core';

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
    const doc = useDocument<DocumentType.QuillV2>();
    const updateSource = React.useRef<'current' | undefined>(undefined);
    const [processingImage, setProcessingImage] = React.useState(false);
    const ref = React.useRef<HTMLDivElement>(null);
    const [theme] = React.useState(props.theme || 'snow');
    const { quill, quillRef, Quill } = useQuill({
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
        readOnly: props.readonly
    });

    // Insert Image(selected by user) to quill
    const insertToEditor = (url: string) => {
        if (!quillRef.current || !quill) {
            return;
        }
        const range = quill.getSelection(true);
        quill.insertEmbed(range.index, 'image', url);
        range.index++;
        quill.setSelection(range, 'api');
        // add new line
        quill.insertText(range.index, '\n');
        range.index++;
        quill.setSelection(range, 'api');
    };

    const insertImage = async (img?: string) => {
        if (!img) {
            return setProcessingImage(false);
        }
        downscaleImage(img)
            .then((img) => {
                insertToEditor(img);
            })
            .catch(() => {
                console.log('Could not insert image');
            })
            .finally(() => {
                if (quillRef.current) {
                    setProcessingImage(false);
                }
            });
    };

    // Open Dialog to select Image File
    const selectLocalImage = () => {
        const input = document.createElement('input');
        input.setAttribute('type', 'file');
        input.setAttribute('accept', 'image/*,image/heic,image/heif');
        input.onchange = () => {
            if (!input.files || input.files.length < 1) {
                return;
            }
            const file = input.files[0];
            setProcessingImage(true);
            file2b64(file).then(insertImage);
        };
        input.click();
    };

    const dropHandler = (event: DragEvent) => {
        setProcessingImage(true);
        dropImage(event).then(insertImage);
    };
    const pasteHandler = (event: ClipboardEvent) => {
        setProcessingImage(true);
        pasteImage(event).then(insertImage);
    };

    /**
     * initial setup of the quill editor
     * with the props of doc
     */
    React.useEffect(() => {
        if (quill) {
            quill.setContents(doc.delta, 'silent');
            const saveHandeler = action((change?: Delta) => {
                if (change) {
                    const retainsOnly = change.ops.every((op) => op.retain !== undefined);
                    const dataAttrsOnly =
                        retainsOnly &&
                        change.ops.every(
                            (op) =>
                                !op.attributes ||
                                Object.keys(op.attributes).every((k) => k.startsWith('data-'))
                        );
                    /**
                     * ignore changes that only retain the current content
                     * and do only change data attributes (which shall not be saved)
                     */
                    if (dataAttrsOnly) {
                        return;
                    }
                }
                updateSource.current = 'current';
                doc.setDelta(quill.getContents());
            });
            quill.on('text-change', saveHandeler);
            quill.keyboard.addBinding({
                key: 's',
                shortKey: true,
                handler: action(() => {
                    doc.saveNow();
                })
            });
            return () => {
                if (doc.isDirty && updateSource.current !== 'current') {
                    saveHandeler();
                }
                quill.off('text-change', saveHandeler);
            };
        }
    }, [quill, updateSource]);

    React.useEffect(() => {
        if (quill) {
            const isEnabled = quill.isEnabled();
            const canEdit = doc.canEdit && !props.readonly;
            if (canEdit && isEnabled) {
                quill.enable();
            } else if (!canEdit && !isEnabled) {
                quill.disable();
            }
        }
    }, [doc.canEdit, quill]);

    /** ensure no context menu is shown when using bubble mode. Otherwise, touch-devices can't start to edit... */
    React.useEffect(() => {
        if (ref.current) {
            if (props.theme === 'bubble') {
                const onContext = (e: MouseEvent) => {
                    e.preventDefault();
                    try {
                        (quill as any).theme.tooltip.edit();
                        (quill as any).theme.tooltip.show();
                    } catch (e) {
                        console.log(e);
                    }
                };
                ref.current.addEventListener('contextmenu', onContext);
                return () => {
                    if (ref.current) {
                        ref.current.removeEventListener('contextmenu', onContext);
                    }
                };
            }
        }
    }, [ref, quill]);

    React.useEffect(() => {
        const onQuillToolbarMouseDown = (e: any) => {
            e.preventDefault();
        };
        if (quill) {
            (quill.getModule('toolbar') as any).addHandler('image', selectLocalImage);
            quill.root.addEventListener('drop', dropHandler, true);
            quill.root.addEventListener('paste', pasteHandler, true);
            (quill.getModule('toolbar') as any).container.addEventListener(
                'mousedown',
                onQuillToolbarMouseDown
            );
        }
        return () => {
            if (quill) {
                (quill.getModule('toolbar') as any).container.removeEventListener(
                    'mousedown',
                    onQuillToolbarMouseDown
                );
            }
        };
    }, [quill]);

    React.useEffect(() => {
        if (!quill) {
            return;
        }

        /**
         * Do not update the quill editor if the change was made by the current quill component
         */
        const source = updateSource.current;
        updateSource.current = undefined;
        if (source === 'current') {
            return;
        }

        quill.setContents(doc.delta, 'silent');
    }, [quill, doc?.delta, updateSource]);

    if (Quill && !quill) {
        class ImageFormat extends BaseImageFormat {
            static formats(domNode: Element) {
                const formats: { [key: string]: string } = {};
                /**
                 * only those attributes are allowed to be set for the local editor
                 */
                ['alt', 'height', 'width', 'style', 'data-selected'].forEach((attribute) => {
                    if (domNode.hasAttribute(attribute)) {
                        formats[attribute] = domNode.getAttribute(attribute)!;
                    }
                });
                return formats;
            }
            format(name: string, value: string) {
                /**
                 * only those attributes are allowed to be set and restored from external sources
                 */
                if (['alt', 'height', 'width', 'style'].includes(name)) {
                    if (value) {
                        this.domNode.setAttribute(name, value);
                    } else {
                        this.domNode.removeAttribute(name);
                    }
                } else {
                    super.format(name, value);
                }
            }
        }
        Quill.register(ImageFormat, true);
        /* Quill register method signature is => static register(path, target, overwrite = false)
        Set overwrite to true to avoid warning
        https://github.com/quilljs/quill/issues/2559#issuecomment-945605414 */
        Quill.register('modules/imageResize', ImageResize, true);
    }

    return (
        <div
            className={clsx(styles.quillEditor, styles.quill, 'notranslate', props.className)}
            onBlur={() => {
                updateSource.current = undefined;
            }}
            ref={ref}
        >
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
