import { type FileTreeDropResult } from '@pierre/trees';
import Directory from '@tdev-models/documents/FileSystem/Directory';
import type DocumentStore from '@tdev-stores/DocumentStore';

export const onDropComplete = (
    documentStore: DocumentStore,
    dir: Directory | undefined
): ((event: FileTreeDropResult) => void) | undefined => {
    if (!dir) {
        return;
    }
    return ({ draggedPaths, target }) => {
        const targetDoc =
            target.kind === 'root' ? dir : dir.allItems.find((d) => d.filePath === target.directoryPath);
        const files = dir.allItems.filter((d) => draggedPaths.includes(d.filePath));
        if (targetDoc && files.length > 0) {
            files.forEach((f) => {
                documentStore.relinkParent(f, targetDoc);
            });
        }
    };
};
