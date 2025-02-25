import { CmsStore } from '@tdev-stores/CmsStore';
import { action, computed, observable } from 'mobx';
import FileStub from './FileStub';
import Dir from './Dir';
import { ApiState } from '@tdev-stores/iStore';
import BinFile from './BinFile';

export interface iEntryProps {
    name: string;
    path: string;
    sha: string;
    url: string;
    html_url: string | null;
    git_url: string | null;
}

abstract class iEntry {
    abstract readonly type: 'file' | 'bin_file' | 'file_stub' | 'dir';
    readonly store: CmsStore;

    readonly name: string;
    readonly path: string;
    readonly sha: string;
    readonly url: string;
    readonly htmlUrl: string | null;
    readonly gitUrl: string | null;
    @observable accessor apiState: ApiState = ApiState.IDLE;

    constructor(props: iEntryProps, store: CmsStore) {
        this.store = store;

        this.name = props.name;
        this.path = props.path;
        this.sha = props.sha;
        this.url = props.url;
        this.htmlUrl = props.html_url;
        this.gitUrl = props.git_url;
    }

    @computed
    get props(): iEntryProps {
        return {
            name: this.name,
            path: this.path,
            url: this.url,
            git_url: this.gitUrl,
            html_url: this.htmlUrl,
            sha: this.sha
        };
    }

    @computed
    get isLoaded() {
        switch (this.type) {
            case 'file':
                return true;
            case 'file_stub':
                return false;
            case 'bin_file':
                return true;
            case 'dir':
                return true;
        }
    }

    @computed
    get _isFileType(): boolean {
        return this.type === 'file' || this.type === 'file_stub' || this.type === 'bin_file';
    }

    @action
    openRecursive() {
        this.tree.forEach((entry) => {
            if (entry?.type === 'dir') {
                console.log('Open from cms.ts');
                entry.setOpen(true);
            }
        });
    }

    @action
    setApiState(state: ApiState) {
        this.apiState = state;
    }

    @action
    withApiState<T>(fn: () => Promise<T>): Promise<T> {
        this.setApiState(ApiState.SYNCING);
        return fn()
            .then((res) => {
                this.setApiState(ApiState.IDLE);
                return res;
            })
            .catch((e) => {
                this.setApiState(ApiState.ERROR);
                throw e;
            });
    }

    isFile(): this is File | FileStub | BinFile {
        return this._isFileType;
    }

    isLoadedFile(): this is File | BinFile {
        return this._isFileType && this.type !== 'file_stub';
    }

    @computed
    get pathParts() {
        return ['/', ...this.path.split('/').filter(Boolean)];
    }

    @computed
    get tree() {
        return this.pathParts.map((part, idx) => {
            return this.store.findEntry(this.branch, this.pathParts.slice(0, idx + 1).join('/'));
        });
    }

    @computed
    get level() {
        return this.pathParts.length - 1;
    }

    @computed
    get parentPath() {
        if (this.path === '/') {
            return undefined;
        }
        const path = this.path.replace(this.name, '').replace(/\/+$/, '');
        if (path === '') {
            return '/';
        }
        return path;
    }

    @computed
    get dir(): Dir | undefined {
        return this.parent as Dir;
    }

    @computed
    get parent() {
        return this.store.findEntry(this.branch, this.parentPath) as Dir;
    }

    @computed
    get children() {
        return this.store.findChildren(this.branch, this.path);
    }

    @computed
    get URL() {
        return new URL(this.url);
    }

    @computed
    get branch() {
        return this.URL.searchParams.get('ref')!;
    }

    resolvePath(relPath: string) {
        const base = this._isFileType ? this.parentPath : this.path;
        return new URL(relPath, `path:/${base}/`).pathname.slice(1);
    }

    findEntryByRelativePath(relPath: string) {
        const resolved = this.resolvePath(relPath);
        return this.store.findEntry(this.branch, resolved);
    }

    // loadAsset(relPath: string, force?: boolean) {
    //     const entry = this.findEntryByRelativePath(relPath);
    //     if (entry && !force) {
    //         return Promise.resolve(entry);
    //     }
    //     const resolved = this.resolvePath(relPath);
    //     return this.store.fetchFile(resolved, this.branch);
    // }
}

export default iEntry;
