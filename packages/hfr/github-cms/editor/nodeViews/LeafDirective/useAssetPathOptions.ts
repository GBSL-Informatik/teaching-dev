import React from 'react';
import { useCmsStore } from '../../../hooks/useCmsStore';
import type iFile from '../../../models/iFile';
import { typedDirectory } from './assetPath';

/**
 * Completes the typed relative path with the directories and the accepted files of its directory,
 * e.g. `./assets/` and `./song.mp3` for `./`. The directory is loaded from the repository.
 */
export const useAssetPathOptions = (typed: string, accept?: (file: iFile) => boolean) => {
    const cmsStore = useCmsStore();
    const file = cmsStore.editedFile?.type === 'file' ? cmsStore.editedFile : undefined;
    const directory = accept ? typedDirectory(typed) : null;

    React.useEffect(() => {
        if (file && directory) {
            file.loadDirectory(directory);
        }
    }, [file, directory]);

    if (!file || !directory || !accept) {
        return undefined;
    }
    return file
        .entriesAt(directory)
        .filter((entry) => entry.type === 'dir' || accept(entry))
        .map((entry) => `${directory}${entry.name}${entry.type === 'dir' ? '/' : ''}`);
};
