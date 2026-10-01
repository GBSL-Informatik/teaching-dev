import {
    FileTreeDirectoryHandle,
    FileTree as FileTreeModel,
    preparePresortedFileTreeInput
} from '@pierre/trees';
import { useFileTree } from '@pierre/trees/react';
import { useStore } from '@tdev-hooks/useStore';
import Directory from '@tdev-models/documents/FileSystem/Directory';
import { default as FileModel } from '@tdev-models/documents/FileSystem/File';
import { isFileSystemType } from '@tdev-models/documents/FileSystem/iFileSystem';
import { observer } from 'mobx-react-lite';
import React from 'react';
import { onDropComplete } from './actions/onDropComplete';
import { onRename } from './actions/onRename';
import { spriteSheet } from './sprites';

export const FileTreeContext = React.createContext<FileTreeModel | null>(null);

export const useFileTreeModel = (): FileTreeModel => {
    const context = React.useContext(FileTreeContext);
    if (!context) {
        throw new Error('useFileTreeModel must be used within a FileTreeContext.Provider');
    }
    return context;
};

interface Props {
    dir: Directory;
    onSelected: (document: FileModel | null) => void;
    children: React.ReactNode;
}
const WithFileTreeModel = observer((props: Props) => {
    const { dir, onSelected } = props;
    const documentStore = useStore('documentStore');
    const docRootStore = useStore('documentRootStore');
    const { model } = useFileTree({
        preparedInput: preparePresortedFileTreeInput(dir?.fileTree ?? []),
        search: true,
        initialVisibleRowCount: 11,
        initialExpandedPaths: dir?.allFiles
            .filter((d) => d.type === 'dir' && d.filePath && d.isOpen)
            .map((d) => d.filePath),
        icons: {
            set: 'complete',
            colored: true,
            spriteSheet: spriteSheet,
            byFileExtension: {
                excalidraw: 'mdi-excalidraw'
            }
        },
        renaming: {
            canRename: (item) => true,
            onRename: onRename(dir),
            onError: (message) => {
                console.error(message);
            }
        },
        dragAndDrop: {
            canDrag: (draggedPaths) => true,
            canDrop: ({ target }) => true,
            onDropComplete: onDropComplete(documentStore, dir),
            onDropError: (message) => {
                console.error(message);
            }
        },
        composition: {
            contextMenu: {
                enabled: true,
                triggerMode: 'both',
                buttonVisibility: 'when-needed'
            }
        },
        flattenEmptyDirectories: false,
        onSelectionChange: (selectedPaths) => {
            const root = docRootStore.find<'dir'>(dir.documentRootId);
            if (!root) {
                return;
            }
            const selected = root.documents
                .filter((d) => isFileSystemType(d))
                .filter((d) => selectedPaths.includes(d.filePath));
            if (selected.length === 1) {
                if (selected[0].type === 'file') {
                    onSelected(selected[0]);
                }
                selected[0].setIsOpen(true);
            }
        }
    });

    React.useEffect(() => {
        const onUnload = () => {
            const folders = dir?.allFiles.filter((d) => d.type === 'dir' && d.filePath) ?? [];
            folders.forEach((dir) => {
                const item = model.getItem(dir.filePath);
                if (item?.isDirectory()) {
                    const isOpen = (item as FileTreeDirectoryHandle).isExpanded();
                    dir.setIsOpen(isOpen);
                }
            });
        };
        window.addEventListener('beforeunload', onUnload);
        return () => {
            onUnload();
            window.removeEventListener('beforeunload', onUnload);
        };
    }, [model]);

    if (!dir) {
        return null;
    }

    return <FileTreeContext.Provider value={model}>{props.children}</FileTreeContext.Provider>;
});
export default WithFileTreeModel;
