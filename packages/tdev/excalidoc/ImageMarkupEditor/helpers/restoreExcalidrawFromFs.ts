import type { ExcalidrawInitialDataState } from '@excalidraw/excalidraw/types';
import requestFileHandle from '@tdev-components/utils/localFS/requestFileHandle';
import originalImageFromScene from './originalImageFromScene';
import writeFileHandle from './writeFileHandle';

/**
 * Restore the original image from the excalidraw sidecar, then remove the
 * sidecar (and any renamed variant).
 *
 * @returns the path of the restored image, null when the scene has no background image.
 */
const restoreExcalidrawFromFs = async (
    root: FileSystemDirectoryHandle,
    excaliSrc: string,
    excaliName: string,
    imgName: string
): Promise<string | null> => {
    const { fileHandle, parentDir } = await requestFileHandle(root, excaliSrc, 'read');
    const data = await fileHandle
        .getFile()
        .then((content) => content.text())
        .then((text) => JSON.parse(text) as ExcalidrawInitialDataState);
    const original = originalImageFromScene(data, imgName);
    if (!original) {
        return null;
    }
    const imgFileHandle = await parentDir.getFileHandle(original.name, { create: true });
    await writeFileHandle(imgFileHandle, original.blob);
    await parentDir.removeEntry(excaliName);
    if (original.name !== imgName) {
        await parentDir.removeEntry(imgName);
    }
    return excaliSrc.replace(excaliName, original.name);
};

export default restoreExcalidrawFromFs;
