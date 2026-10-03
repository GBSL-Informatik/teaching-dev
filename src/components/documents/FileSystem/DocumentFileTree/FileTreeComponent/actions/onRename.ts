import { type FileTreeRenameEvent } from '@pierre/trees';
import Directory from '@tdev-models/documents/FileSystem/Directory';
import File from '@tdev-models/documents/FileSystem/File';

type RenameAction = ((event: FileTreeRenameEvent) => void) | undefined;

export const onRename = (dir: Directory | undefined): RenameAction => {
    if (!dir) {
        return;
    }
    return ({ sourcePath: _sourcePath, destinationPath, isFolder }) => {
        const sourcePath = isFolder ? `${_sourcePath}/` : _sourcePath;
        const file = dir.allFiles.find((d) => d.filePath === sourcePath);
        const hasConflict = dir.allFiles.some((d) => d.filePath === destinationPath);
        if (!file) {
            console.error(
                `File not found for path: ${sourcePath}`,
                dir.allFiles.map((d) => d.filePath)
            );
            return;
        }
        if (hasConflict) {
            console.error(`Destination path already exists: ${destinationPath}`);
            return;
        }
        let newName = destinationPath.replace(file.basePath, '');
        if (newName.includes('/')) {
            console.error(`New name cannot contain slashes: ${newName}`);
            return;
        }
        if (file.type === 'file' && (file as File).document) {
            if ((file as File).document.type !== 'script') {
                const ext = (file as File).fileExtension.toLowerCase();
                if (ext && !newName.toLowerCase().endsWith(`.${ext}`)) {
                    newName = `${newName}.${ext}`;
                }
            }
        }
        file.setName(newName);
    };
};
