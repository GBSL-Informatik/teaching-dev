import { mdiDelete, mdiFilePlus, mdiRename } from '@mdi/js';
import { FileTreeDirectoryHandle, preparePresortedFileTreeInput } from '@pierre/trees';
import { FileTree, useFileTree } from '@pierre/trees/react';
import Button from '@tdev-components/shared/Button';
import { Confirm } from '@tdev-components/shared/Button/Confirm';
import Card from '@tdev-components/shared/Card';
import { SIZE_S } from '@tdev-components/shared/iconSizes';
import { useStore } from '@tdev-hooks/useStore';
import Directory from '@tdev-models/documents/FileSystem/Directory';
import { default as FileModel } from '@tdev-models/documents/FileSystem/File';
import iFileSystem, { isFileSystemType } from '@tdev-models/documents/FileSystem/iFileSystem';
import { mdiExcalidraw } from '@tdev/excalidoc/Component';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import React from 'react';
import NewItem from '../Directory/NewItem';
import DocumentView from '../DocumentView';
import styles from './styles.module.scss';

interface Props {
    dir: Directory;
}
const DocumentFileTree = observer((props: Props) => {
    const { dir } = props;
    const dirId = dir.id;
    const rootId = dir.documentRootId;
    const documentStore = useStore('documentStore');
    const docRootStore = useStore('documentRootStore');
    const [selected, setSelected] = React.useState<FileModel | null>(null);
    const { model } = useFileTree({
        preparedInput: preparePresortedFileTreeInput(dir?.fileTree ?? []),
        search: true,
        id: dir.id,
        initialVisibleRowCount: 11,
        icons: {
            set: 'complete',
            colored: true,
            spriteSheet: `
                <svg aria-hidden="true" width="0" height="0">
                    <symbol id="mdi-excalidraw" viewBox="0 0 24 24">
                        <path d="${mdiExcalidraw}" style="fill: #6965db;" />
                    </symbol>
                </svg>
                `,
            byFileExtension: {
                excalidraw: 'mdi-excalidraw'
            }
        },
        renaming: {
            canRename: (item) => true,
            onRename: ({ sourcePath, destinationPath }) => {
                const dir = documentStore.find(dirId);
                if (!dir) {
                    return;
                }
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
                const targetDoc =
                    target.kind === 'root'
                        ? dir
                        : dir.allFiles.find((d) => d.filePath === target.directoryPath);
                const files = dir.allFiles.filter((d) => draggedPaths.includes(d.filePath));
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
                if (selected[0].type === 'file') {
                    setSelected(selected[0]);
                }
                selected[0].setIsOpen(true);
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
        model.resetPaths({
            preparedInput: preparePresortedFileTreeInput(dir.fileTree ?? []),
            initialExpandedPaths: openPaths
        });
        return () => {
            const folders = dir?.allFiles.filter((d) => d.type === 'dir' && d.filePath) ?? [];
            folders.forEach((dir) => {
                const item = model.getItem(dir.filePath);
                if (item?.isDirectory()) {
                    const isOpen = (item as FileTreeDirectoryHandle).isExpanded();
                    dir.setIsOpen(isOpen);
                }
            });
        };
    }, [model, dir.fileTree]);

    if (!dir) {
        return null;
    }

    return (
        <div className={clsx(styles.container)}>
            <div>
                <FileTree
                    model={model}
                    className={clsx(styles.tree, 'rounded-lg border')}
                    style={{ height: '320px' }}
                    renderContextMenu={(item, context) => {
                        const pos = context.anchorRect;
                        return (
                            <div
                                className={clsx(styles.contextMenu)}
                                style={{
                                    transform: `translateX(${pos.x}px) translateY(${pos.y + 16}px)`
                                }}
                            >
                                <Card classNames={{ card: clsx(styles.menuContent) }}>
                                    {item.kind === 'directory' && (
                                        <Button
                                            text="Neu"
                                            icon={mdiFilePlus}
                                            iconSide="left"
                                            size={SIZE_S}
                                            onClick={async (e) => {
                                                e.stopPropagation();
                                                e.preventDefault();
                                                console.log('Creating new file in', item.path);
                                                if (!dir) {
                                                    return context.close({ restoreFocus: false });
                                                }
                                                const folder = dir.allFiles.find(
                                                    (f) => f.filePath === item.path
                                                );
                                                if (!folder) {
                                                    return context.close({ restoreFocus: false });
                                                }
                                                const names = folder.children
                                                    .filter(
                                                        (c) =>
                                                            isFileSystemType(c) &&
                                                            c.name.startsWith('new-file')
                                                    )
                                                    .map((c) => (c as iFileSystem).name);
                                                let nr = names.length;
                                                while (nr > 0 && names.includes(`new-file(${nr}).py`)) {
                                                    nr = nr + 1;
                                                }
                                                const newName = nr === 0 ? 'new-file' : `new-file(${nr})`;
                                                const file = await documentStore.create({
                                                    type: 'file',
                                                    documentRootId: rootId,
                                                    parentId: folder.id,
                                                    data: {
                                                        name: `${newName}.py`,
                                                        isOpen: false
                                                    }
                                                });
                                                if (file) {
                                                    const doc = await documentStore.create({
                                                        type: 'script',
                                                        documentRootId: rootId,
                                                        parentId: file.id
                                                    });
                                                    if (doc) {
                                                        model.startRenaming(file.filePath);
                                                    }
                                                }
                                                context.close({ restoreFocus: false });
                                            }}
                                        />
                                    )}
                                    <Button
                                        text="Umbenennen"
                                        icon={mdiRename}
                                        iconSide="left"
                                        size={SIZE_S}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            e.preventDefault();
                                            console.log('Renaming', item.path);
                                            model.startRenaming(item.path);
                                            context.close({ restoreFocus: false });
                                        }}
                                    />
                                    <Confirm
                                        text="Löschen"
                                        confirmText="Wirklich?"
                                        icon={mdiDelete}
                                        color="red"
                                        iconSide="left"
                                        size={SIZE_S}
                                        onConfirm={async () => {
                                            const file = dir.allFiles.find((f) => f.filePath === item.path);
                                            if (file) {
                                                await file.delete();
                                            }
                                            context.close({ restoreFocus: false });
                                        }}
                                    />
                                </Card>
                            </div>
                        );
                    }}
                />
                {dir.fileTree.length === 0 && <NewItem directory={dir} />}
            </div>
            <div className={clsx(styles.selectedFile)}>{<DocumentView document={selected?.document} />}</div>
        </div>
    );
});

export default DocumentFileTree;
