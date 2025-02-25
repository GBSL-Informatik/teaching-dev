import { CmsStore } from '@tdev-stores/CmsStore';
import { action, computed, observable, when } from 'mobx';
import iEntry, { iEntryProps } from './iEntry';
import { mdiFolder, mdiFolderOpen, mdiLoading } from '@mdi/js';
import { ApiState } from '@tdev-stores/iStore';

interface DirProps extends iEntryProps {}

export const IMAGE_DIR_NAME = 'images' as const;
class Dir extends iEntry {
    readonly type = 'dir';
    @observable accessor isFetched: boolean = false;
    @observable accessor isOpen: boolean = false;
    @observable accessor apiState: ApiState = ApiState.IDLE;

    constructor(props: DirProps, store: CmsStore) {
        super(props, store);
        // when(
        //     () => this.isFetched,
        //     () => {
        //         this.imageDir?.fetchDirectory()?.then((imgDir) => {
        //             if (imgDir) {
        //                 imgDir.children.forEach((img) => {
        //                     if (img.type === 'file_stub') {
        //                         img.fetchContent();
        //                     }
        //                 });
        //             }
        //         });
        //     }
        // );
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
    get imageDir(): Dir | undefined {
        return this.children.find((child) => child.name === IMAGE_DIR_NAME) as Dir;
    }

    @computed
    get imageDirPath(): string {
        return `${this.path}/${IMAGE_DIR_NAME}`;
    }

    /**
     * The images which are direct children of this folder
     */
    @computed
    get images() {
        const images = this.children.filter((child) => child.isFile() && child.isImage);
        return images;
    }

    @computed
    get isSyncing() {
        return this.apiState === ApiState.SYNCING;
    }

    @computed
    get iconColor() {
        return 'var(--ifm-color-primary)';
    }

    @computed
    get icon() {
        if (this.isSyncing) {
            return mdiLoading;
        }
        if (this.isOpen) {
            return mdiFolderOpen;
        }
        return mdiFolder;
    }
}

export default Dir;
