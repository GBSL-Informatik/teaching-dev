import { useStore } from '@tdev-hooks/useStore';
import BinFile from '@tdev-models/cms/BinFile';
import Dir from '@tdev-models/cms/Dir';
import File from '@tdev-models/cms/File';
import FileStub from '@tdev-models/cms/FileStub';
import { ApiState } from '@tdev-stores/iStore';
import React from 'react';

export const useLoadedFile = <T extends BinFile | File | Dir = BinFile | File | Dir>(
    file: T | FileStub | undefined
): T | undefined => {
    const cmsStore = useStore('cmsStore');
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
