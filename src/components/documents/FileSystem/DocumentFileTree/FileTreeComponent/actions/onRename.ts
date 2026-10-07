import { type FileTreeRenameEvent } from '@pierre/trees';
import type Code from '@tdev-models/documents/Code';
import Directory from '@tdev-models/documents/FileSystem/Directory';
import File from '@tdev-models/documents/FileSystem/File';

type RenameAction = ((event: FileTreeRenameEvent) => void) | undefined;

export const onRename = (dir: Directory | undefined): RenameAction => {
    if (!dir) {
        return;
    }
    return ({ sourcePath: _sourcePath, destinationPath, isFolder }) => {
        const sourcePath = isFolder ? `${_sourcePath}/` : _sourcePath;
        const file = dir.allItems.find((d) => d.filePath === sourcePath);
        const hasConflict = dir.allItems.some((d) => d.filePath === destinationPath);
        if (!file) {
            console.error(
                `File not found for path: ${sourcePath}`,
                dir.allItems.map((d) => d.filePath)
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
            const doc = file as File;
            const ext = doc.fileExtension.toLowerCase();
            if (doc.document.type === 'code') {
                const newExt = newName.includes('.') ? newName.split('.').pop()!.toLowerCase() : '';
                const code = doc.document as Code;
                if (newExt && newExt !== ext && code.code.trim() === '') {
                    // set default code
                    const config = code.store.registeredFileExtensions.find(
                        (c) => c.extension.toLowerCase() === `.${newExt}`
                    );
                    if (config && config.defaultData && 'code' in config.defaultData) {
                        code.setCode(config.defaultData.code || '');
                    }
                }
            } else if (ext && !newName.toLowerCase().endsWith(`.${ext}`)) {
                newName = `${newName}.${ext}`;
            }
        }
        file.setName(newName);
    };
};
