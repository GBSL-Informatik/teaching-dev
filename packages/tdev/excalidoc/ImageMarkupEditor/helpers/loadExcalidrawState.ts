import type { ExcalidrawInitialDataState } from '@excalidraw/excalidraw/types';
import requestFileHandle from '@tdev-components/util/localFS/requestFileHandle';
import { createExcalidrawMarkup, updateRectangleDimensions } from './createExcalidrawMarkup';
import extractExalidrawImageName from './extractExalidrawImageName';
import writeFileHandle from './writeFileHandle';

/**
 * Load or initialise the excalidraw state for the given image path.
 * If a `.excalidraw` sidecar already exists it is read; otherwise a new one
 * is created from the source image and persisted next to it.
 */
const loadExcalidrawState = async (
    root: FileSystemDirectoryHandle,
    src: string
): Promise<ExcalidrawInitialDataState> => {
    const { excaliSrc, excaliName } = extractExalidrawImageName(src);
    let fileHandle: FileSystemFileHandle;
    try {
        ({ fileHandle } = await requestFileHandle(root, excaliSrc, 'readwrite'));
    } catch {
        let parentDir: FileSystemDirectoryHandle;
        ({ fileHandle, parentDir } = await requestFileHandle(root, src, 'read'));
        const excaliData = await createExcalidrawMarkup(fileHandle);
        const excaliFile = await parentDir.getFileHandle(excaliName, { create: true });
        await writeFileHandle(excaliFile, JSON.stringify(excaliData, null, 2));
        fileHandle = excaliFile;
    }
    const data = await fileHandle
        .getFile()
        .then((content) => content.text())
        .then((text) => JSON.parse(text) as ExcalidrawInitialDataState);
    return updateRectangleDimensions(data);
};

export default loadExcalidrawState;
