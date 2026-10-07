import { type FileTreeDropResult } from '@pierre/trees';
import type Directory from '@tdev-models/documents/FileSystem/Directory';
import type DocumentStore from '@tdev-stores/DocumentStore';

export const onDropComplete = (
    documentStore: DocumentStore,
    dir: Directory,
    onComplete?: (succeeded: boolean) => void
): ((event: FileTreeDropResult) => Promise<boolean>) => {
    return async ({ draggedPaths, target }) => {
        let succeeded = false;
        try {
            const targetDoc =
                target.kind === 'root' ? dir : dir.allItems.find((d) => d.filePath === target.directoryPath);
            const paths = new Set(draggedPaths);
            const files = dir.allItems.filter((d) => paths.has(d.filePath));
            if (!targetDoc || targetDoc.type !== 'dir' || files.length === 0 || files.length !== paths.size) {
                return false;
            }
            const results = await Promise.allSettled(
                files.map(async (file) => documentStore.relinkParent(file, targetDoc))
            );
            succeeded = results.every((result) => result.status === 'fulfilled' && result.value);
            return succeeded;
        } finally {
            onComplete?.(succeeded);
        }
    };
};
