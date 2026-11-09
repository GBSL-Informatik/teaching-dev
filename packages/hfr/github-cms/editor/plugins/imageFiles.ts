import { Plugin } from 'prosemirror-state';
import type MdxDocument from '../models/MdxDocument';

const imageOf = (data: DataTransfer | null) => {
    return Array.from(data?.files ?? []).find((file) => file.type.startsWith('image/'));
};

/**
 * Images dropped from the file system or pasted from the clipboard (e.g. a screenshot) are uploaded
 * to `./images` and inserted where they were dropped or pasted.
 * The upload dialog (`ImageUploadDialog`) asks for the name first.
 */
export const imageFiles = (document: MdxDocument) => {
    return new Plugin({
        props: {
            handleDrop: (view, event) => {
                const image = imageOf(event.dataTransfer);
                if (!image) {
                    return false;
                }
                event.preventDefault();
                const dropPos = view.posAtCoords({ left: event.clientX, top: event.clientY })?.pos;
                document.setImageToUpload({ file: image, pos: dropPos ?? view.state.selection.from });
                return true;
            },
            handlePaste: (view, event) => {
                const image = imageOf(event.clipboardData);
                // copied text with images (e.g. from a web page) is pasted as usual
                if (!image || event.clipboardData?.getData('text/plain')) {
                    return false;
                }
                event.preventDefault();
                document.setImageToUpload({ file: image, pos: view.state.selection.from });
                return true;
            }
        }
    });
};
