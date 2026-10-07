import { type FileTree, preparePresortedFileTreeInput } from '@pierre/trees';
import type Directory from '@tdev-models/documents/FileSystem/Directory';

export const syncFileTree = (model: FileTree, dir: Directory) => {
    model.resetPaths({
        preparedInput: preparePresortedFileTreeInput(dir.fileTree),
        initialExpandedPaths: dir.allDirectories.filter((d) => d.filePath && d.isOpen).map((d) => d.filePath)
    });
};
