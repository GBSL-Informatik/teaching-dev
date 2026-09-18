import React from 'react';
import { useStore } from '@tdev-hooks/useStore';
import { observer } from 'mobx-react-lite';
import customFields from '@tdev-components/utils/customFields';
import { FileTree, useFileTree } from '@pierre/trees/react';
import Directory from '@tdev-models/documents/FileSystem/Directory';
import { preparePresortedFileTreeInput } from '@pierre/trees';
import { isFileSystemType } from '@tdev-models/documents/FileSystem/iFileSystem';
import styles from './styles.module.scss';
import clsx from 'clsx';

interface Props {
    dir: Directory;
}
const DocumentFileTree = observer((props: Props) => {
    const { dir } = props;
    const rootId = dir.documentRootId;
    const documentStore = useStore('documentStore');
    const docRootStore = useStore('documentRootStore');
    const { model } = useFileTree({
        preparedInput: preparePresortedFileTreeInput(dir?.fileTree ?? []),
        search: true,
        id: dir.id,
        initialVisibleRowCount: 11,
        icons: {
            set: 'complete',
            colored: false
        },
        renaming: {
            canRename: (item) => item.path !== 'package.json',
            onRename: ({ sourcePath, destinationPath }) => {
                const file = dir.allFiles.find((d) => d.filePath === sourcePath);
                const hasConflict = dir.allFiles.some((d) => d.filePath === destinationPath);
                if (!file) {
                    console.error(`File not found for path: ${sourcePath}`);
                    return;
                }
                if (hasConflict) {
                    console.error(`Destination path already exists: ${destinationPath}`);
                    return;
                }
                const newName = destinationPath.replace(file.basePath, '');
                if (newName.includes('/')) {
                    console.error(`New name cannot contain slashes: ${newName}`);
                    return;
                }
                file.setName(newName);
            },
            onError: (message) => {
                console.error(message);
            }
        },
        dragAndDrop: {
            canDrag: (draggedPaths) => true,
            canDrop: ({ target }) => true,
            onDropComplete: ({ draggedPaths, target }) => {
                const targetDoc = dir.allFiles.find((d) => d.filePath === target.directoryPath);
                const files = dir.allFiles.filter((d) => draggedPaths.includes(d.filePath));
                console.log(
                    files.map((f) => f.filePath),
                    'dropped on',
                    targetDoc?.filePath
                );
                if (targetDoc && files.length > 0) {
                    files.forEach((f) => {
                        documentStore.relinkParent(f, targetDoc);
                    });
                }
            },
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
                selected[0].setIsOpen(true);
                console.log('Selected document:', selected[0].name, selected[0].filePath);
            }
        }
    });

    /**
     * useFileTree only builds the model once, from the initial props - it never
     * reacts to prop changes. Paths often arrive asynchronously (e.g. after a
     * page reload, before the document is fetched), so the tree must be
     * re-synced whenever the paths change after mount.
     */
    React.useEffect(() => {
        const openPaths = dir?.allFiles
            .filter((d) => d.type === 'dir' && d.filePath && d.isOpen)
            .map((d) => d.filePath);
        console.log('open', openPaths);
        model.resetPaths({
            preparedInput: preparePresortedFileTreeInput(dir.fileTree ?? []),
            initialExpandedPaths: openPaths
        });
    }, [model, dir.fileTree]);

    return (
        <FileTree
            model={model}
            className={clsx(styles.tree, 'rounded-lg border')}
            style={{ height: '320px' }}
            renderContextMenu={(item, context) => (
                <div className="rounded-md border bg-background p-2 shadow">
                    <button
                        onClick={() => {
                            context.close({ restoreFocus: false });
                            model.startRenaming(item.path);
                        }}
                        type="button"
                    >
                        Rename
                    </button>
                </div>
            )}
        />
    );
});

export default DocumentFileTree;
