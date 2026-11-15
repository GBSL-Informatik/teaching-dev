import type { ExcalidrawInitialDataState } from '@excalidraw/excalidraw/types';
import { NEW_EXCALIDRAW_DRAWING } from '@tdev/excalidoc/ImageMarkupEditor/helpers/constants';
import ImageEditorPopup from '@tdev/excalidoc/ImageMarkupEditor/ImageEditorPopup';
import { observer } from 'mobx-react-lite';
import { useCmsStore } from '../../../hooks/useCmsStore';
import type MdxDocument from '../../models/MdxDocument';
import { githubImageStorage } from '../../nodeViews/Image/githubImageStorage';

interface Props {
    document: MdxDocument;
}

/**
 * The excalidraw editor for a new drawing (`document.newDrawing`). Saving creates the image
 * and its sidecar in the repository and inserts the image at the cursor.
 */
const NewDrawingEditor = observer(({ document }: Props) => {
    const cmsStore = useCmsStore();
    const { newDrawing, file } = document;
    if (!newDrawing) {
        return null;
    }

    const openStorage = async () => {
        if (!cmsStore.github) {
            return null;
        }
        const storage = githubImageStorage(cmsStore.github, file.branch, newDrawing.path);
        // nothing exists yet, the image is created when the drawing is saved
        const emptyDrawing = structuredClone(NEW_EXCALIDRAW_DRAWING) as ExcalidrawInitialDataState;
        return { ...storage, load: async () => emptyDrawing };
    };

    return (
        <ImageEditorPopup
            open
            mimeType={newDrawing.mimeType}
            openStorage={openStorage}
            onImageChanged={(imagePath) => document.insertNewDrawing(imagePath)}
            onClose={() => document.setNewDrawing(null)}
        />
    );
});

export default NewDrawingEditor;
