import {
    FileTreeDirectoryHandle,
    FileTree as FileTreeModel,
    FileTreeOptions,
    preparePresortedFileTreeInput
} from '@pierre/trees';
import { useFileTree } from '@pierre/trees/react';
import { useDocument } from '@tdev-hooks/useContextDocument';
import { useStore } from '@tdev-hooks/useStore';
import { observer } from 'mobx-react-lite';
import React from 'react';
import { onDropComplete } from './actions/onDropComplete';
import { onRename } from './actions/onRename';
import { syncFileTree } from './actions/syncFileTree';
import { createIconSet } from './createIconSet';

export const FileTreeContext = React.createContext<FileTreeModel | null>(null);

interface Props {
    children: React.ReactNode;
}
const WithFileTreeModel = observer((props: Props) => {
    const dir = useDocument<'dir'>();
    const documentStore = useStore('documentStore');
    const { fileTreeView } = useStore('viewStore');

    const modelRef = React.useRef<FileTreeModel | null>(null);
    const dropPending = React.useRef(false);
    const treeOptions = React.useMemo((): FileTreeOptions => {
        const persistDrop = onDropComplete(documentStore, dir, (succeeded) => {
            dropPending.current = false;
            if (modelRef.current) {
                syncFileTree(modelRef.current, dir);
                if (!succeeded) {
                    fileTreeView.addNotification({
                        rootId: dir.id,
                        type: 'warning',
                        message: 'Nicht alle Dateien konnten verschoben werden.'
                    });
                }
            }
        });
        return {
            preparedInput: preparePresortedFileTreeInput(dir.fileTree),
            search: true,
            initialExpandedPaths: dir.allDirectories
                .filter((d) => d.filePath && d.isOpen)
                .map((d) => d.filePath),
            icons: createIconSet(documentStore),
            renaming: {
                canRename: (item) => item.path !== '',
                onRename: onRename(dir, fileTreeView),
                onError: (message) => {
                    fileTreeView.addNotification({
                        rootId: dir.id,
                        type: 'danger',
                        message
                    });
                }
            },
            unsafeCSS: `[data-file-tree-search-container][data-open='false'] { display: none; }`,
            dragAndDrop: {
                canDrag: () => !dropPending.current,
                canDrop: () => !dropPending.current,
                onDropComplete: (event) => {
                    dropPending.current = true;
                    fileTreeView.clearNotifications(dir.id);
                    return persistDrop(event);
                },
                onDropError: (message) => {
                    fileTreeView.addNotification({
                        rootId: dir.id,
                        type: 'danger',
                        message
                    });
                }
            },
            composition: {
                contextMenu: {
                    enabled: true,
                    triggerMode: 'both',
                    buttonVisibility: 'when-needed'
                }
            },
            renderRowDecoration: ({ item }) => {
                if (item.path === dir.filePath) {
                    return null;
                }
                const selected = dir.selectedFiles.map((f) => f.filePath);
                const displayed = fileTreeView.getSelectedFile(dir.id);
                if (displayed && !selected.some((s) => s === displayed.filePath)) {
                    selected.push(displayed.filePath);
                }
                if (item.kind === 'directory') {
                    if (selected.some((p) => p && p.startsWith(item.path))) {
                        return { icon: 'active-directory' };
                    }
                } else if (item.kind === 'file') {
                    if (selected.some((p) => p === item.path)) {
                        return { icon: 'active-file' };
                    }
                }
                return null;
            },
            initialSelectedPaths: dir.selectedFiles.map((f) => f.filePath),
            flattenEmptyDirectories: false,
            onSelectionChange: (selectedPaths) => {
                const selected = dir.allItems.filter((d) => selectedPaths.includes(d.filePath));

                if (selected.length === 1) {
                    const currentSelected = fileTreeView.getSelectedFile(dir.id);
                    if (currentSelected?.isOpen) {
                        currentSelected.setIsOpen(false);
                    }
                    selected[0].setIsOpen(true);
                    if (selected[0].type === 'file') {
                        fileTreeView.setSelectedFile(dir.id, selected[0].id);
                    }
                }
            }
        };
    }, [dir, documentStore, fileTreeView]);
    const { model } = useFileTree(treeOptions);

    React.useEffect(() => {
        modelRef.current = model;
        return () => {
            modelRef.current = null;
        };
    }, [model]);

    React.useEffect(() => {
        const currentSelected = fileTreeView.getSelectedFile(dir.id);
        if (currentSelected) {
            return;
        }
        const selected = dir.selectedFiles.map((f) => f.filePath);
        if (selected.length > 0) {
            fileTreeView.setSelectedFile(dir.id, dir.selectedFiles[0].id);
        }
    }, [dir, fileTreeView]);

    React.useEffect(() => {
        const disposer = model.subscribe(() => {
            const item = model.getFocusedItem() as FileTreeDirectoryHandle;
            if (!item || !item.isDirectory() || !item.isFocused()) {
                return;
            }
            const path = item.getPath();
            const isOpen = item.isExpanded();
            setTimeout(() => {
                const thisDir = dir.allDirectories.find((f) => f.filePath === path);
                if (thisDir && thisDir.isOpen !== isOpen) {
                    thisDir.setIsOpen(isOpen);
                }
            }, 0);
        });
        return disposer;
    }, [model, dir]);
    /**
     * useFileTree only builds the model once, from the initial props - it never
     * reacts to prop changes. Paths often arrive asynchronously (e.g. after a
     * page reload, before the document is fetched), so the tree must be
     * re-synced whenever the paths change after mount.
     */
    React.useEffect(() => {
        syncFileTree(model, dir);
    }, [model, dir, dir.fileTree]);

    return <FileTreeContext.Provider value={model}>{props.children}</FileTreeContext.Provider>;
});
export default WithFileTreeModel;
