import { useCmsStore } from '@site/packages/hfr/github-cms/hooks/useCmsStore';
import BinFile from '@site/packages/hfr/github-cms/models/BinFile';
import Dir from '@site/packages/hfr/github-cms/models/Dir';
import File from '@site/packages/hfr/github-cms/models/File';
import FileStub from '@site/packages/hfr/github-cms/models/FileStub';
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
