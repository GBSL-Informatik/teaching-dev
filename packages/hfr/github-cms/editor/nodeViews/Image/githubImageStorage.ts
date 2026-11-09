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

/**
 * The images of a branch in the github repository, every write is a commit to the branch.
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

    const writeFile = async (path: string, content: string | Blob) => {
        // an existing file is only updated with its sha
        const existing = loadedFile(path) ?? (await fetchFile(path));
        const sha = existing && !Array.isArray(existing) ? existing.sha : undefined;
        const data = typeof content === 'string' ? content : new Uint8Array(await content.arrayBuffer());
        await github.createOrUpdateFile(path, data, branch, sha);
    };

    const deleteFile = async (path: string) => {
        const file = loadedFile(path);
        if (file) {
            await github.deleteFile(file);
        }
    };

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
            await writeFile(excaliExport, JSON.stringify(state, null, 2));
            await writeFile(imgExport, blob);
            if (isRenamed) {
                await deleteFile(imagePath);
                await deleteFile(excaliSrc);
            }
            return imgExport;
        },
        restore: async () => {
            const sidecar = await loadSidecar();
            const original = sidecar && originalImageFromScene(sidecar, imgName);
            if (!original) {
                return null;
            }
            const restoredPath = excaliSrc.replace(`${imgName}.excalidraw`, original.name);
            await writeFile(restoredPath, original.blob);
            await deleteFile(excaliSrc);
            if (restoredPath !== imagePath) {
                await deleteFile(imagePath);
            }
            return restoredPath;
        }
    };
};
