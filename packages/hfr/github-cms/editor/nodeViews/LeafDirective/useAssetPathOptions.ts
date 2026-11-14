import React from 'react';
import { useCmsStore } from '../../../hooks/useCmsStore';
import type iFile from '../../../models/iFile';
import { typedDirectory, typedName } from './assetPath';

const NO_OPTIONS: string[] = [];

/**
 * Completes the typed relative path with the directories and the accepted files of its directory
 * starting with the typed name, e.g. `./assets/` and `./song.mp3` for `./`.
 * The directory is loaded from the repository.
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
        return NO_OPTIONS;
    }
    const name = typedName(typed);
    return file
        .entriesAt(directory)
        .filter((entry) => entry.name.startsWith(name))
        .filter((entry) => entry.type === 'dir' || accept(entry))
        .map((entry) => `${directory}${entry.name}${entry.type === 'dir' ? '/' : ''}`);
};
