import type { ExcalidrawInitialDataState } from '@excalidraw/excalidraw/types';
import extractExalidrawImageName from './helpers/extractExalidrawImageName';
import loadExcalidrawState from './helpers/loadExcalidrawState';
import restoreExcalidrawFromFs from './helpers/restoreExcalidrawFromFs';
import saveExcalidrawToFs from './helpers/saveExcalidrawToFs';

/**
 * Where an image and its `<image>.excalidraw` sidecar are read from and written to,
 * e.g. the local file system in dev mode or a github repository in the cms.
 */
export interface ExcalidrawImageStorage {
    /** the scene of the sidecar, or a new scene created from the image when there is no sidecar */
    load: () => Promise<ExcalidrawInitialDataState>;
    /** writes the sidecar and the exported image. @returns the image path, it changes when converted to webp */
    save: (state: ExcalidrawInitialDataState, blob: Blob, asWebp: boolean) => Promise<string>;
    /** writes back the original image and removes the sidecar. @returns the image path, null if not restorable */
    restore: () => Promise<string | null>;
}

/** the images in the docusaurus root directory, accessed with the File System Access API */
export const fsImageStorage = (root: FileSystemDirectoryHandle, src: string): ExcalidrawImageStorage => {
    const { excaliSrc, excaliName, imgName } = extractExalidrawImageName(src);
    return {
        load: () => loadExcalidrawState(root, src),
        save: (state, blob, asWebp) => saveExcalidrawToFs(root, src, excaliSrc, imgName, state, blob, asWebp),
        restore: () => restoreExcalidrawFromFs(root, excaliSrc, excaliName, imgName)
    };
};
