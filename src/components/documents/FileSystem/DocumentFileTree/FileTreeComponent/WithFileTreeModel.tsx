import {
    FileTreeDirectoryHandle,
    FileTree as FileTreeModel,
    FileTreeOptions,
    preparePresortedFileTreeInput
} from '@pierre/trees';
import { useFileTree } from '@pierre/trees/react';
import { useDocument } from '@tdev-hooks/useContextDocument';
import { useStore } from '@tdev-hooks/useStore';
import { isFileSystemType } from '@tdev-models/documents/FileSystem/iFileSystem';
import { observer } from 'mobx-react-lite';
import React from 'react';
import { onDropComplete } from './actions/onDropComplete';
import { onRename } from './actions/onRename';
import { createIconSet } from './createIconSet';

export const FileTreeContext = React.createContext<FileTreeModel | null>(null);

export const useFileTreeModel = (): FileTreeModel => {
    const context = React.useContext(FileTreeContext);
    if (!context) {
        throw new Error('useFileTreeModel must be used within a FileTreeContext.Provider');
    }
    return context;
};

interface Props {
    children: React.ReactNode;
}
const WithFileTreeModel = observer((props: Props) => {
    const dir = useDocument<'dir'>();
    const documentStore = useStore('documentStore');
    const docRootStore = useStore('documentRootStore');
    const treeOptions = React.useMemo((): FileTreeOptions => {
        return {
            preparedInput: preparePresortedFileTreeInput(dir.fileTree ?? []),
            search: true,
            initialExpandedPaths: dir?.allFiles
                .filter((d) => d.type === 'dir' && d.filePath && d.isOpen)
                .map((d) => d.filePath),
            icons: createIconSet(documentStore),
            renaming: {
                canRename: (item) => true,
                onRename: onRename(dir),
                onError: (message) => {
                    console.error(message);
                }
            },
            unsafeCSS: `[data-file-tree-search-container][data-open='false'] { display: none; }`,
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
                    selected[0].setIsOpen(true);
                }
            }
        };
    }, [dir]);
    const { model } = useFileTree(treeOptions);

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
    /**
     * useFileTree only builds the model once, from the initial props - it never
     * reacts to prop changes. Paths often arrive asynchronously (e.g. after a
     * page reload, before the document is fetched), so the tree must be
     * re-synced whenever the paths change after mount.
     */
    React.useEffect(() => {
        const openPaths = dir.allFiles
            .filter((d) => d.type === 'dir' && d.filePath && d.isOpen)
            .map((d) => d.filePath);
        model.resetPaths({
            preparedInput: preparePresortedFileTreeInput(dir.fileTree ?? []),
            initialExpandedPaths: openPaths
        });
    }, [model, dir.fileTree]);

    return <FileTreeContext.Provider value={model}>{props.children}</FileTreeContext.Provider>;
});
export default WithFileTreeModel;
