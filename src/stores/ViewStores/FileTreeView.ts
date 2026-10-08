import { AlertType } from '@tdev-components/shared/Alert';
import type File from '@tdev-models/documents/FileSystem/File';
import { RootStore } from '@tdev-stores/rootStore';
import { action, observable } from 'mobx';
import { computedFn } from 'mobx-utils';

export const FILE_TREE_DEFAULT_WIDTH = 240;
export const FILE_TREE_MIN_WIDTH = 120;

interface FileTreeNotification {
    id: string;
    rootId: string;
    message: string;
    type: AlertType;
}

export class FileTreeView {
    readonly root: RootStore;
    selectedFileIds = observable.map<string, string>();
    fileTreeWidths = observable.map<string, number>();
    mobileFileTreeExpanded = observable.map<string, boolean>();
    notifications = observable.array<FileTreeNotification>();

    constructor(root: RootStore) {
        this.root = root;
    }

    notificationsBy = computedFn(
        function (this: FileTreeView, rootId?: string) {
            if (!rootId) {
                return [];
            }
            return this.notifications.filter((n) => n.rootId === rootId);
        },
        { keepAlive: true }
    );

    @action
    addNotification(message: Omit<FileTreeNotification, 'id'>) {
        const notification: FileTreeNotification = {
            id: crypto.randomUUID(),
            ...message
        };
        this.notifications.push(notification);
        return notification;
    }

    @action
    clearNotifications(rootId: string) {
        this.notifications.replace(this.notifications.filter((n) => n.rootId !== rootId));
    }

    @action
    dismissNotification(id: string) {
        this.notifications.replace(this.notifications.filter((n) => n.id !== id));
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

    getSelectedFile = computedFn(
        function (this: FileTreeView, rootDirId?: string): File | undefined {
            if (!rootDirId) {
                return;
            }
            const file = this.root.documentStore.find(this.selectedFileIds.get(rootDirId));
            if (file?.type !== 'file' || file.rootDir?.id !== rootDirId) {
                return;
            }
            return file;
        },
        { keepAlive: true }
    );

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
