import { CmsStore } from '@tdev-stores/CmsStore';
import { action, computed, observable } from 'mobx';
import type { FileType } from './FileStub';
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

    /**
     * returns true if the file type has initially (dir) or by design (file_stub) no content
     * and thus must be fetched from the server
     */
    @computed
    get mustBeFetched() {
        switch (this.type) {
            case 'file':
                return false;
            case 'file_stub':
                return true;
            case 'bin_file':
                return false;
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

    isFile(): this is FileType {
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
        const path = this.path.replace(new RegExp(`${this.name}$`), '').replace(/\/+$/, '');
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

    /**
     *
     * @param to the file for which the relative path should be calculated
     * @returns the relative path from this entry to the given file
     * @example
     * ```ts
     * const file = store.findEntry('main', 'docs/gallery/index.mdx');
     * file.relativePath('docs/gallery/images/snow.jpg')    // => './images/snow.jpg'
     * file.relativePath('docs/images/snow.jpg')            // => '../images/snow.jpg'
     * // static files are referenced as absolute pagth
     * file.relativePath('static/images/snow.jpg')            // => '/static/images/snow.jpg'
     * ```
     */
    relativePath(to: iEntry) {
        const thisParts = this._isFileType ? this.pathParts.slice(0, -1) : this.pathParts.slice();
        const pathLength = thisParts.length - 1; // the path always starts with '/' - do not count this
        const toParts = to.pathParts.slice();
        // remove common parts
        while (toParts[0] === thisParts[0]) {
            toParts.splice(0, 1);
            thisParts.splice(0, 1);
        }
        if (thisParts.length === pathLength && toParts[1] === 'static') {
            // it is an absolute path and can not be resolved by docusaurus - return the absolute path
            return ['/', ...to.pathParts.slice(2)].join('/');
        }
        const relPath = [...(thisParts.length > 0 ? thisParts.map(() => '..') : ['.']), ...toParts];
        return relPath.join('/');
    }

    findEntryByRelativePath(relPath: string) {
        const resolved = this.resolvePath(relPath);
        return this.store.findEntry(this.branch, resolved);
    }
}

export default iEntry;
