import type Quill from 'quill';
import type Toolbar from 'quill/modules/toolbar';
import React from 'react';
import { downscaleImage } from '../quill-img-compress/downscaleImage';
import dropImage from '../quill-img-compress/dropImage';
import { file2b64 } from '../quill-img-compress/file2b64';
import pasteImage from '../quill-img-compress/pasteImage';
import type ImageResize from '../quill-img-resize';

/** Own image input, conversion, resize controls and their cleanup for one editor instance. */
export const useQuillImages = (quill: Quill | undefined): boolean => {
    const [processingImage, setProcessingImage] = React.useState(false);

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

    return processingImage;
};
