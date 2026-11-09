import type { ExcalidrawInitialDataState } from '@excalidraw/excalidraw/types';
import requestFileHandle from '@tdev-components/utils/localFS/requestFileHandle';
import exportPaths from './exportPaths';
import writeFileHandle from './writeFileHandle';

/**
 * Persist excalidraw state and exported image blob to the file system.
 * When `asWebp` is true the image (and sidecar) are renamed to `.webp`
 * and the original files are removed.
 *
 * @returns the final image path (may differ from `src` after a webp transform).
 */
const saveExcalidrawToFs = async (
    root: FileSystemDirectoryHandle,
    src: string,
    excaliSrc: string,
    imgName: string,
    state: ExcalidrawInitialDataState,
    blob: Blob,
    asWebp: boolean
): Promise<string> => {
    const { imgExport, excaliExport, isRenamed } = exportPaths(src, excaliSrc, imgName, asWebp);

    const { fileHandle, parentDir } = await requestFileHandle(root, excaliExport, 'readwrite', true);
    const { fileHandle: imgFileHandle } = await requestFileHandle(root, imgExport, 'readwrite', true);
    await writeFileHandle(fileHandle, JSON.stringify(state, null, 2));
    await writeFileHandle(imgFileHandle, blob);

    if (isRenamed) {
        try {
            await parentDir.removeEntry(imgName);
            await parentDir.removeEntry(`${imgName}.excalidraw`);
        } catch (err) {
            console.error('Error removing entry when transforming to WebP:', err);
        }
    }

    return imgExport;
};

export default saveExcalidrawToFs;
