import type { FileTree } from '@pierre/trees';
import type Directory from '@tdev-models/documents/FileSystem/Directory';

export const getFocusedDirectory = (model: FileTree, root: Directory): Directory | undefined => {
    const path = model.getFocusedPath();
    const focused = root.allItems.find((item) => item.filePath === path);
    if (!focused) {
        return root;
    }
    if (focused.type === 'dir') {
        return focused as Directory;
    }
    return focused.parent?.type === 'dir' ? focused.parent : undefined;
};
