import { type CmsStore } from '@tdev-stores/CmsStore';
import iFile, { FileStubProps } from './iFile';
import { computed } from 'mobx';
import type BinFile from './BinFile';
import type File from './File';

export const DUMMY_PROPS: FileStubProps = {
    name: '',
    path: '',
    download_url: '',
    git_url: '',
    html_url: '',
    sha: '',
    size: -1,
    url: '',
    encoding: ''
} as const;

export type FileType = File | FileStub | BinFile;

class FileStub extends iFile {
    readonly type = 'file_stub';
    static DummyFile(path: string, branch: string, store: CmsStore, addToStore?: boolean) {
        const pathParts = path.split('/');
        const url = `dummy://?ref=${branch}`; // needed for branch name
        const dummy = new FileStub(
            { ...DUMMY_PROPS, name: pathParts[pathParts.length - 1], path: path, url: url },
            store
        );
        if (addToStore) {
            store.github?._addFileEntry(branch, dummy);
        }

        return dummy;
    }

    @computed
    get iconColor() {
        return 'var(--ifm-color-gray-600)';
    }
}

export default FileStub;
