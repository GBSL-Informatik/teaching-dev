import { type FileTree, type FileTreeRenameEvent } from '@pierre/trees';
import type Code from '@tdev-models/documents/Code';
import type Directory from '@tdev-models/documents/FileSystem/Directory';
import type File from '@tdev-models/documents/FileSystem/File';
import iFileSystem from '@tdev-models/documents/FileSystem/iFileSystem';
import { type FileTreeView } from '@tdev-stores/ViewStores/FileTreeView';
import { syncFileTree } from './syncFileTree';

type RenameAction = (event: FileTreeRenameEvent) => void;

export const onRename = (
    dir: Directory,
    fileTreeView: FileTreeView,
    getModel: () => FileTree | null
): RenameAction => {
    const reportError = (message: string) => {
        fileTreeView.addNotification({
            rootId: dir.id,
            type: 'danger',
            message
        });
    };
    const reconcileFileTree = (file: iFileSystem, destinationPath: string, isFolder: boolean) => {
        const model = getModel();
        const actualPath = file?.filePath;
        const requestedPath = isFolder ? `${destinationPath}/` : destinationPath;
        if (!model || actualPath === requestedPath) {
            return;
        }
        syncFileTree(model, dir);
        for (const path of model.getSelectedPaths()) {
            model.getItem(path)?.deselect();
        }
        const item = actualPath ? model.getItem(actualPath) : null;
        item?.select();
        item?.focus();
    };
    return ({ sourcePath: _sourcePath, destinationPath, isFolder }) => {
        const sourcePath = isFolder ? `${_sourcePath}/` : _sourcePath;
        const file = dir.allItems.find((d) => d.filePath === sourcePath);
        // @pierre/trees moves the item after onRename returns, ignoring its result.
        // Its onError only covers built-in validation, not errors from this callback.
        // Reconcile after that move when validation failed or the name was normalized.
        queueMicrotask(() => {
            reconcileFileTree(file!, destinationPath, isFolder);
        });
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
        const hasConflict2 = dir.allItems.some((d) => d !== file && d.filePath === finalPath);
        if (hasConflict2) {
            reportError(`Dateipfad existiert bereits: ${finalPath}`);
            return;
        }
        file.setName(newName)?.then((res) => {
            if (res) {
                fileTreeView.clearNotifications(dir.id);
            } else {
                // If the rename operation fails, we need to reconcile the file tree
                reportError(
                    `Fehler beim Umbenennen - Seite neu laden um den gespeicherten Stand wiederherzustellen.`
                );
            }
        });
    };
};
