import React from 'react';
import type { DirType } from '@tdev-components/FileSystem/Dir';
import writeFileHandle from '../helpers/writeFileHandle';
import buildImageTree from '../helpers/buildImageTree';
import requestFileHandle from '@tdev-components/util/localFS/requestFileHandle';

const useRenameImage = (
    dirHandle: FileSystemDirectoryHandle | null,
    selectedSrc: string | null,
    excaliSrc: string,
    excaliName: string,
    setDirTree: React.Dispatch<React.SetStateAction<DirType | null>>,
    openImage: (src: string) => Promise<void>
) => {
    return React.useCallback(async () => {
        if (!dirHandle || !selectedSrc) {
            return;
        }
        const currentName = selectedSrc.split('/').pop() || selectedSrc;
        const currentExt = currentName.substring(currentName.lastIndexOf('.'));
        const baseName = currentName.substring(0, currentName.lastIndexOf('.'));
        const input = window.prompt(`Neuer Dateiname (${currentExt}):`, baseName);
        if (!input) {
            return;
        }
        const newBase = input.trim();
        if (!newBase || newBase === baseName) {
            return;
        }
        const newName = `${newBase}${currentExt}`;
        const pathParts = selectedSrc.split('/');
        pathParts.pop();
        const newSrc = pathParts.length > 0 ? `${pathParts.join('/')}/${newName}` : newName;
        try {
            // Check if target already exists
            try {
                await requestFileHandle(dirHandle, newSrc, 'read', false);
                window.alert(`Die Datei "${newName}" existiert bereits.`);
                return;
            } catch {
                // Expected – target doesn't exist
            }
            // Copy image file
            const { fileHandle: oldImgHandle, parentDir } = await requestFileHandle(
                dirHandle,
                selectedSrc,
                'readwrite',
                false
            );
            const oldImgFile = await oldImgHandle.getFile();
            const newImgHandle = await parentDir.getFileHandle(newName, { create: true });
            await writeFileHandle(newImgHandle, await oldImgFile.arrayBuffer());
            await parentDir.removeEntry(currentName);
            // Copy excalidraw sidecar if it exists
            try {
                const { fileHandle: oldExcaliHandle } = await requestFileHandle(
                    dirHandle,
                    excaliSrc,
                    'readwrite',
                    false
                );
                const oldExcaliFile = await oldExcaliHandle.getFile();
                const newExcaliHandle = await parentDir.getFileHandle(`${newName}.excalidraw`, {
                    create: true
                });
                await writeFileHandle(newExcaliHandle, await oldExcaliFile.text());
                await parentDir.removeEntry(excaliName);
            } catch {
                // No sidecar – that's fine
            }
            // Refresh tree and open renamed image
            const tree = await buildImageTree(dirHandle);
            setDirTree(tree);
            openImage(newSrc);
        } catch (error) {
            console.error('Error renaming image:', error);
            window.alert(`Fehler beim Umbenennen: ${error}`);
        }
    }, [dirHandle, selectedSrc, excaliSrc, excaliName, setDirTree, openImage]);
};

export default useRenameImage;
