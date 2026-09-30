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
import { Hashery } from 'hashery';
import { observer } from 'mobx-react-lite';
import React from 'react';
import NewItem from '../Directory/NewItem';
import DocumentView from '../DocumentView';
import styles from './styles.module.scss';

const hashery = new Hashery({ cache: { enabled: false, maxSize: 20 } });

interface Props {
    dir: Directory;
}

interface FTreeProps {
    dir: Directory;
    onSelected: (document: FileModel | null) => void;
}
const DocumentFileTreeComponent = observer((props: FTreeProps) => {
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
            onRename: ({ sourcePath: _sourcePath, destinationPath, isFolder }) => {
                const dir = documentStore.find(dirId);
                if (!dir || dir.type !== 'dir') {
                    console.error(`Directory not found for id: ${dirId}`, dir);
                    return;
                }
                const sourcePath = isFolder ? `${_sourcePath}/` : _sourcePath;
                const file = dir.allFiles.find((d) => d.filePath === sourcePath);
                const hasConflict = dir.allFiles.some((d) => d.filePath === destinationPath);
                if (!file) {
                    console.error(
                        `File not found for path: ${sourcePath}`,
                        dir.allFiles.map((d) => d.filePath)
                    );
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
                console.log('setting new name', newName, 'for file', file.filePath);
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
                                            const folder = dir.allFiles.find((f) => f.filePath === item.path);
                                            if (!folder) {
                                                return context.close({ restoreFocus: false });
                                            }
                                            const names = folder.children
                                                .filter(
                                                    (c) =>
                                                        isFileSystemType(c) && c.name.startsWith('new-file')
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
    );
});

const DocumentFileTree = observer((props: Props) => {
    const { dir } = props;
    const [selected, setSelected] = React.useState<FileModel | null>(null);
    const hash = hashery.toHashSync([dir.id, dir.fileTree]);

    return (
        <div className={clsx(styles.container)}>
            <DocumentFileTreeComponent dir={dir} key={hash} onSelected={setSelected} />
            <div className={clsx(styles.selectedFile)}>{<DocumentView document={selected?.document} />}</div>
        </div>
    );
});

export default DocumentFileTree;
