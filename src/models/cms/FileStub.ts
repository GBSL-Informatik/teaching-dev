import { type CmsStore } from '@tdev-stores/CmsStore';
import iFileStub, { FileStubProps } from './iFileStub';

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

class FileStub extends iFileStub {
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
}

export default FileStub;
