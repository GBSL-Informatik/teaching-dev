import type File from '@tdev-models/documents/FileSystem/File';
import { RootStore } from '@tdev-stores/rootStore';
import { action, observable } from 'mobx';

export const FILE_TREE_DEFAULT_WIDTH = 240;
export const FILE_TREE_MIN_WIDTH = 120;

export class FileTreeView {
    readonly root: RootStore;
    selectedFileIds = observable.map<string, string>();
    fileTreeWidths = observable.map<string, number>();
    mobileFileTreeExpanded = observable.map<string, boolean>();

    constructor(root: RootStore) {
        this.root = root;
    }
    @action
    setSelectedFile(rootId: string, fileId: string | null) {
        if (fileId === null) {
            this.selectedFileIds.delete(rootId);
            this.mobileFileTreeExpanded.delete(rootId);
        } else {
            this.selectedFileIds.set(rootId, fileId);
            this.mobileFileTreeExpanded.set(rootId, false);
        }
    }

    getSelectedFile(rootId?: string): File | undefined {
        if (!rootId) {
            return;
        }
        const file = this.root.documentStore.find(this.selectedFileIds.get(rootId));
        if (file?.type !== 'file' || file.rootDir?.id !== rootId) {
            return;
        }
        return file;
    }

    getFileTreeWidth(rootId: string) {
        return this.fileTreeWidths.get(rootId) ?? FILE_TREE_DEFAULT_WIDTH;
    }

    isMobileFileTreeExpanded(rootId: string) {
        return this.mobileFileTreeExpanded.get(rootId) ?? !this.getSelectedFile(rootId);
    }

    @action
    setMobileFileTreeExpanded(rootId: string, expanded: boolean) {
        this.mobileFileTreeExpanded.set(rootId, expanded);
    }

    isFileTreeCollapsed(rootId: string) {
        return this.getFileTreeWidth(rootId) === 0;
    }

    @action
    setFileTreeWidth(rootId: string, width: number, maxWidth = Infinity) {
        const nextWidth = Math.max(0, Math.min(width, maxWidth));
        this.fileTreeWidths.set(rootId, nextWidth < FILE_TREE_MIN_WIDTH ? 0 : nextWidth);
    }

    @action
    cleanup() {
        this.selectedFileIds.clear();
        this.fileTreeWidths.clear();
        this.mobileFileTreeExpanded.clear();
    }
}
