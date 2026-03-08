import type { ExcalidrawInitialDataState } from '@excalidraw/excalidraw/types';
import type { OrderedExcalidrawElement } from '@excalidraw/excalidraw/element/types';
import requestFileHandle from '@tdev-components/util/localFS/requestFileHandle';
import { getImageElementFromScene, getImageFileFromScene } from './getElementsFromScene';
import dataUrlToBlob from './dataUrlToBlob';
import { CustomData } from './constants';
import writeFileHandle from './writeFileHandle';

/**
 * Restore the original image from the excalidraw sidecar, then remove the
 * sidecar (and any renamed variant).
 *
 * @returns `true` when the restore was successful.
 */
const restoreExcalidrawFromFs = async (
    root: FileSystemDirectoryHandle,
    excaliSrc: string,
    excaliName: string,
    imgName: string
): Promise<boolean> => {
    const { fileHandle, parentDir } = await requestFileHandle(root, excaliSrc, 'read');
    const data = await fileHandle
        .getFile()
        .then((content) => content.text())
        .then((text) => JSON.parse(text) as ExcalidrawInitialDataState);
    const [backgroundImage] = getImageElementFromScene(data.elements as readonly OrderedExcalidrawElement[]);
    const backgroundFile = getImageFileFromScene(data.files);
    if (backgroundFile && backgroundImage) {
        const cData = backgroundImage.customData as Partial<CustomData>;
        const initExtension = cData.initExtension || '.png';
        const restoredName = imgName.endsWith(initExtension)
            ? imgName
            : `${imgName.split('.').slice(0, -1).join('.')}${initExtension}`;
        const imgFileHandle = await parentDir.getFileHandle(restoredName, { create: true });
        await writeFileHandle(imgFileHandle, dataUrlToBlob(backgroundFile.dataURL));
        await parentDir.removeEntry(excaliName);
        if (restoredName !== imgName) {
            await parentDir.removeEntry(imgName);
        }
        return true;
    }
    return false;
};

export default restoreExcalidrawFromFs;
