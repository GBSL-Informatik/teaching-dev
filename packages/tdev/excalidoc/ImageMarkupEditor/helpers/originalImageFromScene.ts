import type { OrderedExcalidrawElement } from '@excalidraw/excalidraw/element/types';
import type { ExcalidrawInitialDataState } from '@excalidraw/excalidraw/types';
import { CustomData } from './constants';
import dataUrlToBlob from './dataUrlToBlob';
import { getImageElementFromScene, getImageFileFromScene } from './getElementsFromScene';

/**
 * The image the scene was created from, with its original name, e.g. `cat.png` for `cat.webp`.
 * Null for a drawing without a background image.
 */
const originalImageFromScene = (
    state: ExcalidrawInitialDataState,
    imgName: string
): { name: string; blob: Blob } | null => {
    const [backgroundImage] = getImageElementFromScene(state.elements as readonly OrderedExcalidrawElement[]);
    const backgroundFile = getImageFileFromScene(state.files);
    if (!backgroundFile || !backgroundImage) {
        return null;
    }
    const initExtension = (backgroundImage.customData as Partial<CustomData>).initExtension || '.png';
    const name = imgName.endsWith(initExtension)
        ? imgName
        : `${imgName.split('.').slice(0, -1).join('.')}${initExtension}`;
    return { name, blob: dataUrlToBlob(backgroundFile.dataURL) };
};

export default originalImageFromScene;
