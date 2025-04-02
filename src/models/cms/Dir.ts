import { CmsStore } from '@tdev-stores/CmsStore';
import { action, computed, observable, when } from 'mobx';
import iEntry, { iEntryProps } from './iEntry';
import { mdiFolder, mdiFolderOpen, mdiLoading } from '@mdi/js';
import { ApiState } from '@tdev-stores/iStore';
import File from './File';
import FileStub, { FileType } from './FileStub';
import BinFile from './BinFile';

interface DirProps extends iEntryProps {}

export enum Asset {
    IMAGE = 'images',
    FILE = 'assets'
}

class Dir extends iEntry {
    readonly type = 'dir';
    @observable accessor isFetched: boolean = false;
    @observable accessor isOpen: boolean = false;
    @observable accessor apiState: ApiState = ApiState.IDLE;

    constructor(props: DirProps, store: CmsStore) {
        super(props, store);
    }

    @action
    setOpen(open: boolean) {
        this.isOpen = open;
        if (open && !this.isFetched) {
            this.fetchDirectory();
        }
    }

    @action
    fetchDirectory(force: boolean = false) {
        if (this.isFetched && !force) {
            return Promise.resolve(this);
        }
        if (this.isSyncing) {
            return Promise.resolve(this);
        }
        return this.withApiState(() => {
            return this.store.github!.fetchDirectory(this.branch, this.path, force).then(
                action(() => {
                    this.setIsFetched(true);
                    return this;
                })
            );
        });
    }

    @action
    setIsFetched(fetched: boolean) {
        this.isFetched = fetched;
    }

    @computed
    get enrties() {
        if (!this.path) {
            return [];
        }
        return this.store.github?.entries.get(this.branch)?.filter((e) => e.parentPath === this.path);
    }

    @computed
    get indexFile(): FileType | undefined {
        return this.enrties?.find((d) => d.isFile() && /(index\.)|(README\.mdx?)/gi.test(d.name)) as
            | FileType
            | undefined;
    }

    @computed
    get hasIndexFile() {
        return !!this.indexFile;
    }

    /**
     * used to upload images to this folder
     */
    @computed
    get imageDirPath(): string {
        return `${this.path}/${Asset.IMAGE}`;
    }

    @computed
    get isSyncing() {
        return this.apiState === ApiState.SYNCING;
    }

    @computed
    get iconColor() {
        if (this.isFetched || this.isSyncing) {
            return 'var(--ifm-color-primary)';
        }
        return 'var(--ifm-color-gray-700)';
    }

    @computed
    get iconOpen() {
        if (this.isSyncing) {
            return mdiLoading;
        }
        return mdiFolderOpen;
    }

    @computed
    get iconClosed() {
        if (this.isSyncing) {
            return mdiLoading;
        }
        return mdiFolder;
    }

    @computed
    get icon() {
        if (this.isOpen) {
            return this.iconOpen;
        }
        return this.iconClosed;
    }
}

export default Dir;
