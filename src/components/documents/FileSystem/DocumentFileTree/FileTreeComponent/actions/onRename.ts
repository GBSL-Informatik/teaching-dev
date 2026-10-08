import { type FileTreeRenameEvent } from '@pierre/trees';
import type Code from '@tdev-models/documents/Code';
import Directory from '@tdev-models/documents/FileSystem/Directory';
import File from '@tdev-models/documents/FileSystem/File';
import { type FileTreeView } from '@tdev-stores/ViewStores/FileTreeView';

type RenameAction = (event: FileTreeRenameEvent) => void;

export const onRename = (dir: Directory, fileTreeView: FileTreeView): RenameAction => {
    const reportError = (message: string) => {
        fileTreeView.addNotification({
            rootId: dir.id,
            type: 'danger',
            message
        });
    };
    return ({ sourcePath: _sourcePath, destinationPath, isFolder }) => {
        const sourcePath = isFolder ? `${_sourcePath}/` : _sourcePath;
        const file = dir.allItems.find((d) => d.filePath === sourcePath);
        const hasConflict = dir.allItems.some((d) => d.filePath === destinationPath);
        if (!file) {
            reportError(`Datei nicht gefunden: ${sourcePath}`);
            return;
        }
        if (hasConflict) {
            reportError(`Dateipfad existiert bereits: ${destinationPath}`);
            return;
        }
        let newName = destinationPath.replace(file.basePath, '');
        if (newName.includes('/')) {
            reportError(`Name darf keine Schrägstriche enthalten: ${newName}`);
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
        const finalPath = `${file.basePath}${newName}`;
        const hasConflict2 = dir.allItems.some((d) => d.filePath === finalPath);
        if (hasConflict2) {
            reportError(`Dateipfad existiert bereits: ${finalPath}`);
            return;
        }
        file.setName(newName);
        fileTreeView.clearNotifications(dir.id);
    };
};
