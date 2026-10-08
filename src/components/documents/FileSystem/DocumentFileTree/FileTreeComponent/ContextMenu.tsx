import { mdiClose, mdiDelete, mdiFileMove, mdiFolderMove, mdiRename } from '@mdi/js';
import { FileTree as FileTreeComponent } from '@pierre/trees/react';
import Alert from '@tdev-components/shared/Alert';
import Button from '@tdev-components/shared/Button';
import { Confirm } from '@tdev-components/shared/Button/Confirm';
import Card from '@tdev-components/shared/Card';
import { SIZE_S } from '@tdev-components/shared/iconSizes';
import { useDocument } from '@tdev-hooks/useContextDocument';
import iFileSystem from '@tdev-models/documents/FileSystem/iFileSystem';
import { observer } from 'mobx-react-lite';
import React, { ComponentProps } from 'react';
import MoveItem from '../../Actions/MoveItem';
import { useFileTreeModel } from '../hooks/useFileTreeModel';
import { syncFileTree } from './actions/syncFileTree';
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
    const model = useFileTreeModel();
    const currentSelection = model.getSelectedPaths();
    const files = currentSelection
        .map((path) => dir.allItems.find((f) => f.filePath === path))
        .filter((f): f is iFileSystem => !!f);
    const [move, setMove] = React.useState(false);
    const [pending, setPending] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
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

    if (files.length === 0) {
        return null;
    }

    const file = files.length === 1 ? files[0] : null;

    return (
        <div
            className={styles.contextMenu}
            style={{
                transform: `translateX(${pos.x + shiftX}px) translateY(${pos.y + 16 + shiftY}px)`
            }}
            ref={ref}
        >
            <Card
                classNames={{ header: styles.menuHeader }}
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
                {error && <Alert type="danger">{error}</Alert>}
                {move && file ? (
                    <MoveItem item={file} onDone={() => context.close({ restoreFocus: true })} />
                ) : (
                    <>
                        {file && (
                            <>
                                <Button
                                    text="Umbenennen"
                                    icon={mdiRename}
                                    iconSide="left"
                                    size={SIZE_S}
                                    disabled={pending || item.path === ''}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        e.preventDefault();
                                        model.startRenaming(item.path);
                                        context.close({ restoreFocus: false });
                                    }}
                                />
                                <Button
                                    text="Verschieben"
                                    icon={file.type === 'dir' ? mdiFolderMove : mdiFileMove}
                                    onClick={() => setMove(true)}
                                    size={SIZE_S}
                                    color="blue"
                                    iconSide="left"
                                    disabled={pending || item.path === ''}
                                />
                            </>
                        )}
                        <Confirm
                            text={files.length === 1 ? 'Löschen' : `${files.length} Löschen`}
                            confirmText="Wirklich?"
                            icon={mdiDelete}
                            color="red"
                            iconSide="left"
                            size={SIZE_S}
                            disabled={pending || item.path === ''}
                            onConfirm={async () => {
                                if (files.length > 0) {
                                    setPending(true);
                                    setError(null);
                                    try {
                                        const deleted = await Promise.all(files.map((f) => f.delete()));
                                        if (deleted.some((d) => !d)) {
                                            const nFailed = deleted.filter((d) => !d).length;
                                            setError(
                                                `${nFailed}/${files.length} ${files.length > 1 ? 'Dateien konnten' : 'Datei konnte'} nicht gelöscht werden.`
                                            );
                                            return;
                                        }
                                        syncFileTree(model, dir);
                                    } finally {
                                        setPending(false);
                                    }
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
