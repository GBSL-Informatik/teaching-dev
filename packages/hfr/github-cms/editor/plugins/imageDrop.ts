import { Plugin } from 'prosemirror-state';
import type MdxDocument from '../models/MdxDocument';

/**
 * Images dropped from the file system are uploaded to `./images` and inserted where they were dropped.
 * The upload dialog (`DroppedImageDialog`) asks for the name first.
 */
export const imageDrop = (document: MdxDocument) => {
    return new Plugin({
        props: {
            handleDrop: (view, event) => {
                const files = Array.from(event.dataTransfer?.files ?? []);
                const image = files.find((file) => file.type.startsWith('image/'));
                if (!image) {
                    return false;
                }
                event.preventDefault();
                const dropPos = view.posAtCoords({ left: event.clientX, top: event.clientY })?.pos;
                document.setDroppedImage({ file: image, pos: dropPos ?? view.state.selection.from });
                return true;
            }
        }
    });
};
