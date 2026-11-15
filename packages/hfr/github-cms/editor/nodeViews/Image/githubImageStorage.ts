import type { ExcalidrawInitialDataState } from '@excalidraw/excalidraw/types';
import {
    createExcalidrawMarkup,
    updateRectangleDimensions
} from '@tdev/excalidoc/ImageMarkupEditor/helpers/createExcalidrawMarkup';
import exportPaths from '@tdev/excalidoc/ImageMarkupEditor/helpers/exportPaths';
import extractExalidrawImageName from '@tdev/excalidoc/ImageMarkupEditor/helpers/extractExalidrawImageName';
import originalImageFromScene from '@tdev/excalidoc/ImageMarkupEditor/helpers/originalImageFromScene';
import type { ExcalidrawImageStorage } from '@tdev/excalidoc/ImageMarkupEditor/storage';
import FileStub from '../../../models/FileStub';
import type Github from '../../../models/Github';
import type { FileChange } from '../../../models/Github';

/**
 * The images of a branch in the github repository, each save or restore is a single commit to the branch.
 * Unlike in dev mode, the sidecar is not written when an image is opened, only when it is saved.
 */
export const githubImageStorage = (
    github: Github,
    branch: string,
    imagePath: string
): ExcalidrawImageStorage => {
    const { excaliSrc, imgName } = extractExalidrawImageName(imagePath);

    const fetchFile = (path: string) => github.fetchFile(FileStub.DummyFile(path, branch, github.store));

    const loadedFile = (path: string) => {
        const entry = github.store.findEntry(branch, path);
        return entry?.type === 'file' || entry?.type === 'bin_file' ? entry : undefined;
    };

    /** a deletion of the file, when it exists on github */
    const deletionOf = (path: string): FileChange[] => {
        const entry = github.store.findEntry(branch, path);
        const exists = entry && entry.type !== 'dir' && !entry.isDummy;
        return exists ? [{ path, content: null }] : [];
    };

    const asBytes = async (blob: Blob) => new Uint8Array(await blob.arrayBuffer());

    const loadSidecar = async (): Promise<ExcalidrawInitialDataState | null> => {
        const sidecar = await fetchFile(excaliSrc);
        if (!sidecar || Array.isArray(sidecar) || sidecar.type !== 'file') {
            return null;
        }
        return JSON.parse(sidecar.content);
    };

    return {
        load: async () => {
            const sidecar = await loadSidecar();
            if (sidecar) {
                return updateRectangleDimensions(sidecar);
            }
            const image = loadedFile(imagePath) ?? (await fetchFile(imagePath));
            if (!image || Array.isArray(image) || image.type !== 'bin_file') {
                throw new Error(`${imagePath} not found`);
            }
            const file = new File([image.binData], image.name, {
                type: `${image.mimeType}/${image.mimeExtension}`
            });
            return updateRectangleDimensions(await createExcalidrawMarkup(file));
        },
        save: async (state, blob, asWebp) => {
            const { imgExport, excaliExport, isRenamed } = exportPaths(imagePath, excaliSrc, imgName, asWebp);
            const oldFiles = isRenamed ? [...deletionOf(imagePath), ...deletionOf(excaliSrc)] : [];
            await github.commitFiles(branch, `Update drawing ${imgExport}`, [
                { path: excaliExport, content: JSON.stringify(state, null, 2) },
                { path: imgExport, content: await asBytes(blob) },
                ...oldFiles
            ]);
            return imgExport;
        },
        restore: async () => {
            const sidecar = await loadSidecar();
            const original = sidecar && originalImageFromScene(sidecar, imgName);
            if (!original) {
                return null;
            }
            const restoredPath = excaliSrc.replace(`${imgName}.excalidraw`, original.name);
            const oldImage = restoredPath !== imagePath ? deletionOf(imagePath) : [];
            await github.commitFiles(branch, `Restore original ${restoredPath}`, [
                { path: restoredPath, content: await asBytes(original.blob) },
                ...deletionOf(excaliSrc),
                ...oldImage
            ]);
            return restoredPath;
        }
    };
};
