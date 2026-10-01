import { FileTreeDirectoryHandle, preparePresortedFileTreeInput } from '@pierre/trees';
import { FileTree, useFileTree } from '@pierre/trees/react';
import { useStore } from '@tdev-hooks/useStore';
import Directory from '@tdev-models/documents/FileSystem/Directory';
import { default as FileModel } from '@tdev-models/documents/FileSystem/File';
import { isFileSystemType } from '@tdev-models/documents/FileSystem/iFileSystem';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import React from 'react';
import { onDropComplete } from './actions/onDropComplete';
import { onRename } from './actions/onRename';
import ContextMenu from './ContextMenu';
import { spriteSheet } from './sprites';
import styles from './styles.module.scss';

interface Props {
    dir: Directory;
    onSelected: (document: FileModel | null) => void;
    className?: string;
}
const FileTreeComponent = observer((props: Props) => {
    const { dir, onSelected } = props;
    const dirId = dir.id;
    const rootId = dir.documentRootId;
    const documentStore = useStore('documentStore');
    const docRootStore = useStore('documentRootStore');
    const { model } = useFileTree({
        preparedInput: preparePresortedFileTreeInput(dir?.fileTree ?? []),
        search: true,
        id: dir.id,
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
            const root = docRootStore.find<'dir'>(rootId);
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

    return (
        <div className={clsx(props.className)}>
            <FileTree
                model={model}
                className={clsx(styles.tree, 'rounded-lg border')}
                style={{ height: '320px' }}
                renderContextMenu={(item, context) => {
                    return <ContextMenu dir={dir} model={model} item={item} context={context} />;
                }}
            />
        </div>
    );
});
export default FileTreeComponent;
