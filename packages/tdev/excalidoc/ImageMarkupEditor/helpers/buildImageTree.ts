import type { DirType } from '@tdev-components/FileSystem/Dir';
import { IMAGE_RE } from './constants';

/**
 * Recursively scan a directory handle and build a DirType tree containing only
 * image files (and the directories that contain them).  Files ending with
 * `.excalidraw` are excluded so only the actual images show up in the tree.
 */
const buildImageTree = async (
    dirHandle: FileSystemDirectoryHandle,
    name: string = dirHandle.name
): Promise<DirType | null> => {
    const children: (DirType | string)[] = [];
    for await (const entry of (dirHandle as any).values()) {
        if (entry.kind === 'directory') {
            const subTree = await buildImageTree(entry as FileSystemDirectoryHandle, entry.name);
            if (subTree) {
                children.push(subTree);
            }
        } else if (entry.kind === 'file' && IMAGE_RE.test(entry.name)) {
            children.push(entry.name);
        }
    }
    if (children.length === 0) {
        return null;
    }
    // Sort: directories first (objects), then files (strings), each alphabetically
    children.sort((a, b) => {
        const aIsDir = typeof a !== 'string';
        const bIsDir = typeof b !== 'string';
        if (aIsDir !== bIsDir) {
            return aIsDir ? -1 : 1;
        }
        const aName = typeof a === 'string' ? a : a.name;
        const bName = typeof b === 'string' ? b : b.name;
        return aName.localeCompare(bName);
    });
    return { name, children };
};

export default buildImageTree;
