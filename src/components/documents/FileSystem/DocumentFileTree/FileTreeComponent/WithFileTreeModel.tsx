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
import { createIconSet } from './createIconSet';

export const FileTreeContext = React.createContext<FileTreeModel | null>(null);

interface Props {
    children: React.ReactNode;
}
const WithFileTreeModel = observer((props: Props) => {
    const dir = useDocument<'dir'>();
    const documentStore = useStore('documentStore');
    const viewStore = useStore('viewStore');
    const treeOptions = React.useMemo((): FileTreeOptions => {
        return {
            preparedInput: preparePresortedFileTreeInput(dir.fileTree ?? []),
            search: true,
            initialExpandedPaths: dir?.allItems
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
            renderRowDecoration: ({ item }) => {
                if (item.path === dir.filePath) {
                    return null;
                }
                const selected = dir.selectedFiles.map((f) => f.filePath);
                if (item.path && selected.some((p) => p.startsWith(item.path))) {
                    return { icon: `active-${item.kind}` };
                }
                return null;
            },
            initialSelectedPaths: dir?.selectedFiles.map((f) => f.filePath),
            flattenEmptyDirectories: false,
            onSelectionChange: (selectedPaths) => {
                const selected = dir.allItems.filter((d) => selectedPaths.includes(d.filePath));
                if (selected.length === 1) {
                    const currentSelected = viewStore.getSelectedFile(dir.id);
                    if (currentSelected?.isOpen) {
                        currentSelected.setIsOpen(false);
                    }
                    selected[0].setIsOpen(true);
                    if (selected[0].type === 'file') {
                        viewStore.setSelectedFile(dir.id, selected[0].id);
                    }
                }
            }
        };
    }, [dir]);
    const { model } = useFileTree(treeOptions);

    React.useEffect(() => {
        const currentSelected = viewStore.getSelectedFile(dir.id);
        if (currentSelected) {
            return;
        }
        const selected = dir.selectedFiles.map((f) => f.filePath);
        if (selected.length > 0) {
            viewStore.setSelectedFile(dir.id, dir.selectedFiles[0].id);
        }
    }, [dir, viewStore]);

    React.useEffect(() => {
        const disposer = model.subscribe(() => {
            const item = model.getFocusedItem() as FileTreeDirectoryHandle;
            if (!item || !item.isDirectory() || !item.isFocused()) {
                return;
            }
            const path = item.getPath();
            const isOpen = item.isExpanded();
            setTimeout(() => {
                if (!dir || dir.type !== 'dir') {
                    return;
                }
                const thisDir = dir.allDirectories.find((f) => f.filePath === path);
                if (thisDir && thisDir.isOpen !== isOpen) {
                    thisDir.setIsOpen(isOpen);
                }
            }, 0);
        });
        return disposer;
    }, [model]);
    /**
     * useFileTree only builds the model once, from the initial props - it never
     * reacts to prop changes. Paths often arrive asynchronously (e.g. after a
     * page reload, before the document is fetched), so the tree must be
     * re-synced whenever the paths change after mount.
     */
    React.useEffect(() => {
        console.log('WithFileTreeModel: syncing paths for', dir.fileTree?.length, 'items');
        const openPaths = dir.allItems
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
