import { useCmsStore } from '@tdev/github-cms/hooks/useCmsStore';
import FileStub from '@tdev/github-cms/models/FileStub';
import { ApiState } from '@tdev-stores/iStore';
import React from 'react';
export const isRelPath = (path?: string) => {
    if (!path) {
        return false;
    }
    if (path.startsWith('.')) {
        return true;
    }
    if (path.startsWith('/')) {
        return false;
    }
    if (path.startsWith('https://') || path.startsWith('http://')) {
        return false;
    }
    if (path.startsWith('pathname:///')) {
        return false;
    }
    return true;
};
export const useAssetFile = (relPath: string, withDummy: boolean = true) => {
    const cmsStore = useCmsStore();
    const { editedFile } = cmsStore;
    const isRelAsset = React.useMemo(() => {
        return isRelPath(relPath);
    }, [relPath]);
    // editedFile.findEntryByRelativePath(relPath);

    const path = React.useMemo(() => {
        if (!isRelAsset) {
            return undefined;
        }
        return editedFile?.resolvePath(relPath);
    }, [relPath, isRelAsset, editedFile]);

    const file = cmsStore.findEntry(editedFile?.branch, path);

    React.useEffect(() => {
        const { branch } = editedFile || {};
        if (file && file.type === 'file_stub' && file.isSyncing) {
            return;
        }
        if (file && file.type === 'file_stub') {
            cmsStore.fetchFile(file);
            return;
        }
        if (!file && branch && path) {
            cmsStore.fetchFile(FileStub.DummyFile(path, branch, cmsStore, withDummy));
        }
    }, [editedFile, file, path, cmsStore]);

    if (!withDummy && file?.type === 'file_stub') {
        return undefined;
    }

    return file;
};
