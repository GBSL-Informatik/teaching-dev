import { mdiDelete, mdiFilePlus, mdiRename } from '@mdi/js';
import { FileTree } from '@pierre/trees';
import { FileTree as FileTreeComponent } from '@pierre/trees/react';
import Button from '@tdev-components/shared/Button';
import { Confirm } from '@tdev-components/shared/Button/Confirm';
import Card from '@tdev-components/shared/Card';
import { SIZE_S } from '@tdev-components/shared/iconSizes';
import { useStore } from '@tdev-hooks/useStore';
import Directory from '@tdev-models/documents/FileSystem/Directory';
import iFileSystem, { isFileSystemType } from '@tdev-models/documents/FileSystem/iFileSystem';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import { ComponentProps } from 'react';
import styles from './styles.module.scss';

type RenderContextMenuFn = Exclude<ComponentProps<typeof FileTreeComponent>['renderContextMenu'], undefined>;
type FileTreeContextMenuItem = Parameters<RenderContextMenuFn>[0];
type FileTreeContextMenuOpenContext = Parameters<RenderContextMenuFn>[1];

interface Props {
    dir: Directory;
    model: FileTree;
    item: FileTreeContextMenuItem;
    context: FileTreeContextMenuOpenContext;
}

const ContextMenu = observer((props: Props) => {
    const { model, dir, item, context } = props;
    const pos = context.anchorRect;
    const documentStore = useStore('documentStore');

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
                                .filter((c) => isFileSystemType(c) && c.name.startsWith('new-file'))
                                .map((c) => (c as iFileSystem).name);
                            let nr = names.length;
                            while (nr > 0 && names.includes(`new-file(${nr}).py`)) {
                                nr = nr + 1;
                            }
                            const newName = nr === 0 ? 'new-file' : `new-file(${nr})`;
                            const file = await documentStore.create({
                                type: 'file',
                                documentRootId: dir.documentRootId,
                                parentId: folder.id,
                                data: {
                                    name: `${newName}.py`,
                                    isOpen: false
                                }
                            });
                            if (file) {
                                const doc = await documentStore.create({
                                    type: 'script',
                                    documentRootId: dir.documentRootId,
                                    parentId: file.id
                                });
                                if (doc) {
                                    // TODO: Since the model is recreated on every change, this won't have any effect.
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
});

export default ContextMenu;
