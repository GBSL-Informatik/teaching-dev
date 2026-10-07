import { mdiClose, mdiDelete, mdiFileMove, mdiFilePlus, mdiFolderMove, mdiRename } from '@mdi/js';
import { FileTree as FileTreeComponent } from '@pierre/trees/react';
import Button from '@tdev-components/shared/Button';
import { Confirm } from '@tdev-components/shared/Button/Confirm';
import Card from '@tdev-components/shared/Card';
import { SIZE_S } from '@tdev-components/shared/iconSizes';
import { useDocument } from '@tdev-hooks/useContextDocument';
import { useStore } from '@tdev-hooks/useStore';
import iFileSystem, { isFileSystemType } from '@tdev-models/documents/FileSystem/iFileSystem';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import React, { ComponentProps } from 'react';
import MoveItem from '../../Actions/MoveItem';
import { useFileTreeModel } from '../hooks/useFileTreeModel';
import styles from './styles.module.scss';

type RenderContextMenuFn = Exclude<ComponentProps<typeof FileTreeComponent>['renderContextMenu'], undefined>;
type FileTreeContextMenuItem = Parameters<RenderContextMenuFn>[0];
type FileTreeContextMenuOpenContext = Parameters<RenderContextMenuFn>[1];

interface Props {
    item: FileTreeContextMenuItem;
    context: FileTreeContextMenuOpenContext;
}

const ContextMenu = observer((props: Props) => {
    const { item, context } = props;
    const pos = context.anchorRect;
    const dir = useDocument<'dir'>();
    const documentStore = useStore('documentStore');
    const model = useFileTreeModel();
    const file = dir.allItems.find((f) => f.filePath === item.path);
    const [move, setMove] = React.useState(false);
    const [shiftX, setShiftX] = React.useState(0);
    const [shiftY, setShiftY] = React.useState(0);
    const ref = React.useRef<HTMLDivElement>(null);

    React.useLayoutEffect(() => {
        const popup = ref.current;
        if (!popup) {
            return;
        }
        const keepInsideWindow = () => {
            const popupRect = popup.getBoundingClientRect();
            const deltaX =
                popupRect.left < 0
                    ? -popupRect.left
                    : popupRect.right > window.innerWidth
                      ? Math.max(-popupRect.left, window.innerWidth - popupRect.right - 16)
                      : 0;
            const deltaY =
                popupRect.top < 0
                    ? -popupRect.top
                    : popupRect.bottom > window.innerHeight
                      ? Math.max(-popupRect.top, window.innerHeight - popupRect.bottom - 32)
                      : 0;

            // Keep existing shifts when the popup fits, including after folders collapse.
            if (deltaX !== 0) {
                setShiftX(popupRect.left + deltaX - pos.x);
            }
            if (deltaY !== 0) {
                setShiftY(popupRect.top + deltaY - pos.y - 16);
            }
        };

        const resizeObserver = new ResizeObserver(keepInsideWindow);
        resizeObserver.observe(popup, { box: 'border-box' });
        window.addEventListener('resize', keepInsideWindow);
        keepInsideWindow();

        return () => {
            resizeObserver.disconnect();
            window.removeEventListener('resize', keepInsideWindow);
        };
    }, [pos.x, pos.y, move]);

    return (
        <div
            className={clsx(styles.contextMenu)}
            style={{
                transform: `translateX(${pos.x + shiftX}px) translateY(${pos.y + 16 + shiftY}px)`
            }}
            ref={ref}
        >
            <Card
                classNames={{ card: clsx(styles.menuContent), header: clsx(styles.menuHeader) }}
                header={
                    move && (
                        <Button
                            icon={mdiClose}
                            text="Abbrechen"
                            onClick={() => {
                                setMove(false);
                                setShiftX(0);
                                setShiftY(0);
                            }}
                        />
                    )
                }
            >
                {move && file ? (
                    <MoveItem item={file} onDone={() => context.close({ restoreFocus: true })} />
                ) : (
                    <>
                        {item.kind === 'directory' && (
                            <Button
                                text="Neu"
                                icon={mdiFilePlus}
                                iconSide="left"
                                size={SIZE_S}
                                onClick={async (e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    if (!dir) {
                                        return context.close({ restoreFocus: false });
                                    }
                                    const folder = dir.allItems.find((f) => f.filePath === item.path);
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
                                model.startRenaming(item.path);
                                context.close({ restoreFocus: false });
                            }}
                        />
                        {file && (
                            <Button
                                text="Verschieben"
                                icon={file?.type === 'dir' ? mdiFolderMove : mdiFileMove}
                                onClick={() => setMove(true)}
                                size={SIZE_S}
                                color="blue"
                                iconSide="left"
                            />
                        )}
                        <Confirm
                            text="Löschen"
                            confirmText="Wirklich?"
                            icon={mdiDelete}
                            color="red"
                            iconSide="left"
                            size={SIZE_S}
                            onConfirm={async () => {
                                const file = dir.allItems.find((f) => f.filePath === item.path);
                                if (file) {
                                    await file.delete();
                                }
                                context.close({ restoreFocus: false });
                            }}
                        />
                    </>
                )}
            </Card>
        </div>
    );
});

export default ContextMenu;
