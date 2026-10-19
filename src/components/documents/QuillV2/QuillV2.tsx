import { mdiFlashTriangle } from '@mdi/js';
import Icon from '@mdi/react';
import Loader from '@tdev-components/Loader';
import SyncStatus from '@tdev-components/SyncStatus';
import { useDocument } from '@tdev-hooks/useContextDocument';
import { MetaInit } from '@tdev-models/documents/QuillV2';
import { ToolbarOptions } from '@tdev-models/documents/QuillV2/helpers/toolbar';
import clsx from 'clsx';
import { action, reaction } from 'mobx';
import { observer } from 'mobx-react-lite';
import { Delta } from 'quill/core';
import 'quill/dist/quill.bubble.css'; // Add css for snow theme
import 'quill/dist/quill.snow.css'; // Add css for snow theme
import BaseImageFormat from 'quill/formats/image';
import type Toolbar from 'quill/modules/toolbar';
import React from 'react';
import { useQuill } from 'react-quilljs';
import { downscaleImage } from './quill-img-compress/downscaleImage';
import dropImage from './quill-img-compress/dropImage';
import { file2b64 } from './quill-img-compress/file2b64';
import pasteImage from './quill-img-compress/pasteImage';
import ImageResize from './quill-img-resize';
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
        readOnly: !doc.canEdit || props.readonly
    });

    React.useEffect(() => {
        if (!quill) {
            return;
        }

        let localDelta: Delta | undefined;
        const handleTextChange = action((change: Delta) => {
            const dataAttrsOnly = change.ops.every(
                (op) =>
                    op.retain !== undefined &&
                    (!op.attributes || Object.keys(op.attributes).every((key) => key.startsWith('data-')))
            );
            if (dataAttrsOnly) {
                return;
            }
            localDelta = quill.getContents();
            doc.setDelta(localDelta);
        });
        const handleSave = action(() => {
            doc.saveNow();
        });
        const disposeSync = reaction(
            () => doc.delta,
            (delta) => {
                if (delta !== localDelta) {
                    (quill.getModule('imageResize') as ImageResize | undefined)?.hide();
                    quill.setContents(delta, 'silent');
                }
                localDelta = undefined;
            },
            { fireImmediately: true }
        );
        quill.history.clear();

        quill.on('text-change', handleTextChange);
        quill.keyboard.addBinding({ key: 's', shortKey: true, handler: handleSave });

        return () => {
            disposeSync();
            quill.off('text-change', handleTextChange);
            // Quill exposes its bindings but has no removeBinding API.
            quill.keyboard.bindings.s = quill.keyboard.bindings.s.filter(
                (binding) => binding.handler !== handleSave
            );
        };
    }, [doc, quill]);

    React.useEffect(() => {
        if (!quill) {
            return;
        }
        return reaction(
            () => doc.canEdit,
            (canEdit) => {
                const enabled = canEdit && !props.readonly;
                quill.enable(enabled);
                if (!enabled) {
                    (quill.getModule('imageResize') as ImageResize | undefined)?.hide();
                }
            },
            { fireImmediately: true }
        );
    }, [doc, quill, props.readonly]);

    /** ensure no context menu is shown when using bubble mode. Otherwise, touch-devices can't start to edit... */
    React.useEffect(() => {
        const element = ref.current;
        if (!element || !quill || theme !== 'bubble') {
            return;
        }
        const handleContextMenu = (event: MouseEvent) => {
            event.preventDefault();
            try {
                (quill as any).theme.tooltip.edit();
                (quill as any).theme.tooltip.show();
            } catch (error) {
                console.log(error);
            }
        };
        element.addEventListener('contextmenu', handleContextMenu);
        return () => element.removeEventListener('contextmenu', handleContextMenu);
    }, [quill, theme]);

    React.useEffect(() => {
        if (!quill) {
            return;
        }

        let disposed = false;
        let fileInput: HTMLInputElement | undefined;
        const root = quill.root;
        const toolbar = quill.getModule('toolbar') as Toolbar | undefined;
        const toolbarElement = toolbar?.container;
        const previousImageHandler = toolbar?.handlers.image;
        const imageResize = quill.getModule('imageResize') as ImageResize | undefined;
        imageResize?.attach();

        const insertImage = async (source: Promise<string | undefined>) => {
            setProcessingImage(true);
            try {
                const image = await source;
                if (!image || disposed || !quill.isEnabled()) {
                    return;
                }
                const url = await downscaleImage(image);
                if (disposed || !quill.isEnabled()) {
                    return;
                }
                const index = quill.getSelection(true)?.index ?? quill.getLength() - 1;
                quill.insertEmbed(index, 'image', url, 'user');
                quill.insertText(index + 1, '\n', 'user');
                quill.setSelection(index + 2, 'api');
            } catch (error) {
                if (!disposed) {
                    console.log('Could not insert image', error);
                }
            } finally {
                if (!disposed) {
                    setProcessingImage(false);
                }
            }
        };

        const handleSelectImage = () => {
            if (disposed || !quill.isEnabled()) {
                return;
            }
            if (fileInput) {
                fileInput.onchange = null;
            }
            const input = document.createElement('input');
            fileInput = input;
            input.type = 'file';
            input.accept = 'image/*,image/heic,image/heif';
            input.onchange = () => {
                const file = input.files?.[0];
                if (file && !disposed && quill.isEnabled()) {
                    void insertImage(file2b64(file));
                }
            };
            input.click();
        };
        const handleDrop = (event: DragEvent) => {
            if (!disposed && quill.isEnabled()) {
                void insertImage(dropImage(event));
            }
        };
        const handlePaste = (event: ClipboardEvent) => {
            if (!disposed && quill.isEnabled()) {
                void insertImage(pasteImage(event));
            }
        };
        const handleToolbarMouseDown = (event: MouseEvent) => {
            event.preventDefault();
        };

        toolbar?.addHandler('image', handleSelectImage);
        root.addEventListener('drop', handleDrop, true);
        root.addEventListener('paste', handlePaste, true);
        toolbarElement?.addEventListener('mousedown', handleToolbarMouseDown);

        return () => {
            disposed = true;
            if (fileInput) {
                fileInput.onchange = null;
            }
            root.removeEventListener('drop', handleDrop, true);
            root.removeEventListener('paste', handlePaste, true);
            toolbarElement?.removeEventListener('mousedown', handleToolbarMouseDown);
            if (toolbar?.handlers.image === handleSelectImage) {
                if (previousImageHandler) {
                    toolbar.addHandler('image', previousImageHandler);
                } else {
                    delete toolbar.handlers.image;
                }
            }
            imageResize?.destroy();
        };
    }, [quill]);

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
