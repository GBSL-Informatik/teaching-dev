import React from 'react';
import type { ExcalidrawInitialDataState } from '@excalidraw/excalidraw/types';
import type { DirType } from '@tdev-components/FileSystem/Dir';
import { NEW_EXCALIDRAW_DRAWING, VALID_EXPORT_EXTENSIONS } from '../helpers/constants';
import writeFileHandle from '../helpers/writeFileHandle';
import buildImageTree from '../helpers/buildImageTree';

const DEFAULT_IMAGES: Record<string, string> = {
    '.png': require('../../Component/Preview/images/excalidraw-logo.png').default,
    '.jpg': require('../../Component/Preview/images/excalidraw-logo.jpg').default,
    '.jpeg': require('../../Component/Preview/images/excalidraw-logo.jpg').default,
    '.svg': require('../../Component/Preview/images/excalidraw-logo.svg').default,
    '.webp': require('../../Component/Preview/images/excalidraw-logo.webp').default
};

const useCreateNewDrawing = (
    dirHandle: FileSystemDirectoryHandle | null,
    setDirTree: React.Dispatch<React.SetStateAction<DirType | null>>,
    setSelectedSrc: React.Dispatch<React.SetStateAction<string | null>>,
    setExcaliState: React.Dispatch<React.SetStateAction<ExcalidrawInitialDataState | null>>
) => {
    return React.useCallback(async () => {
        if (!dirHandle) {
            return;
        }
        const input = window.prompt('Name der neuen Zeichnung (z.B. sketch.png):');
        if (!input) {
            return;
        }
        const name = input.trim();
        if (!name) {
            return;
        }
        // Ensure the name has a valid export extension
        const hasValidExt = VALID_EXPORT_EXTENSIONS.has(`.${name.split('.').pop()?.toLowerCase()}`);
        const fileName = hasValidExt ? name : `${name}.png`;
        const excaliFileName = `${fileName}.excalidraw`;
        try {
            // Check if file already exists
            try {
                await dirHandle.getFileHandle(excaliFileName);
                window.alert(`Die Datei "${excaliFileName}" existiert bereits.`);
                return;
            } catch {
                // Expected – file doesn't exist yet
            }
            // Write default image file based on extension
            const ext = `.${fileName.split('.').pop()!.toLowerCase()}`;
            const defaultImageUrl = DEFAULT_IMAGES[ext];
            if (defaultImageUrl) {
                const response = await fetch(defaultImageUrl);
                const blob = await response.blob();
                const imgFile = await dirHandle.getFileHandle(fileName, { create: true });
                await writeFileHandle(imgFile, blob);
            }
            const excaliFile = await dirHandle.getFileHandle(excaliFileName, { create: true });
            await writeFileHandle(excaliFile, JSON.stringify(NEW_EXCALIDRAW_DRAWING, null, 2));
            // Refresh tree and open the new drawing
            const tree = await buildImageTree(dirHandle);
            setDirTree(tree);
            setSelectedSrc(fileName);
            setExcaliState(NEW_EXCALIDRAW_DRAWING as ExcalidrawInitialDataState);
        } catch (error) {
            console.error('Error creating new drawing:', error);
            window.alert(`Fehler beim Erstellen der Zeichnung: ${error}`);
        }
    }, [dirHandle, setDirTree, setSelectedSrc, setExcaliState]);
};

export default useCreateNewDrawing;
