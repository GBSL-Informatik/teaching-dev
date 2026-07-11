import { useCmsStore } from '../../../hooks/useCmsStore';
import BinFile from '../../../models/BinFile';
import Dir from '../../../models/Dir';
import File from '../../../models/File';
import FileStub from '../../../models/FileStub';
import { ApiState } from '@tdev-stores/iStore';
import React from 'react';

export const useLoadedFile = <T extends BinFile | File | Dir = BinFile | File | Dir>(
    file: T | FileStub | undefined
): T | undefined => {
    const cmsStore = useCmsStore();
    React.useEffect(() => {
        if (file && file.type === 'file_stub' && file.apiState !== ApiState.SYNCING) {
            cmsStore.fetchFile(file);
        }
    }, [file, cmsStore.github]);
    if (!file || file.type === 'file_stub') {
        return undefined;
    }

    return file;
};
