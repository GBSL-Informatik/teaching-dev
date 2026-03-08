import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import { useStore } from '@tdev-hooks/useStore';
import Button from '@tdev-components/shared/Button';
import Icon from '@mdi/react';
import { mdiFolderOpen, mdiChevronLeft, mdiChevronRight, mdiFileTree, mdiClose } from '@mdi/js';
import useIsMobileView from '@tdev-hooks/useIsMobileView';
import ImageMarkupEditor from '..';
import requestLocalDirectoryAccess, {
    restoreAccess
} from '@tdev-components/util/localFS/requestLocalDirectoryAccess';
import { indexedDb } from '@tdev-api/base';
import type { ExcalidrawInitialDataState } from '@excalidraw/excalidraw/types';
import extractExalidrawImageName from '../helpers/extractExalidrawImageName';
import Dir, { DirType } from '@tdev-components/FileSystem/Dir';
import { FullscreenContext } from '@tdev-hooks/useFullscreenTargetId';
import RequestFullscreen from '@tdev-components/shared/RequestFullscreen';
import loadExcalidrawState from '../helpers/loadExcalidrawState';
import saveExcalidrawToFs from '../helpers/saveExcalidrawToFs';
import restoreExcalidrawFromFs from '../helpers/restoreExcalidrawFromFs';

const IMAGE_RE = /\.(jpg|jpeg|png|gif|bmp|webp|svg|avif|tiff|ico|heic|heif)$/i;

interface Props {
    className?: string;
}

/**
 * Recursively scan a directory handle and build a DirType tree containing only
 * image files (and the directories that contain them).  Files ending with
 * `.excalidraw` are excluded so only the actual images show up in the tree.
 */
const buildImageTree = async (
    dirHandle: FileSystemDirectoryHandle,
    name: string = dirHandle.name
): Promise<DirType | null> => {
    const children: (DirType | string)[] = [];
    for await (const entry of (dirHandle as any).values()) {
        if (entry.kind === 'directory') {
            const subTree = await buildImageTree(entry as FileSystemDirectoryHandle, entry.name);
            if (subTree) {
                children.push(subTree);
            }
        } else if (entry.kind === 'file' && IMAGE_RE.test(entry.name)) {
            children.push(entry.name);
        }
    }
    if (children.length === 0) {
        return null;
    }
    // Sort: directories first (objects), then files (strings), each alphabetically
    children.sort((a, b) => {
        const aIsDir = typeof a !== 'string';
        const bIsDir = typeof b !== 'string';
        if (aIsDir !== bIsDir) {
            return aIsDir ? -1 : 1;
        }
        const aName = typeof a === 'string' ? a : a.name;
        const bName = typeof b === 'string' ? b : b.name;
        return aName.localeCompare(bName);
    });
    return { name, children };
};

const FS_STANDALONE_EDITOR_ID = 'excalidraw-standalone-editor';

const StandaloneEditor = observer((props: Props) => {
    const id = React.useId();
    const viewStore = useStore('viewStore');
    const [dirHandle, setDirHandle] = React.useState<FileSystemDirectoryHandle | null>(null);
    const [dirTree, setDirTree] = React.useState<DirType | null>(null);
    const [selectedSrc, setSelectedSrc] = React.useState<string | null>(null);
    const [excaliState, setExcaliState] = React.useState<ExcalidrawInitialDataState | null>(null);
    const loadingRef = React.useRef<string | null>(null);

    const { excaliName, excaliSrc, imgName, mimeType } = React.useMemo(
        () =>
            selectedSrc
                ? extractExalidrawImageName(selectedSrc)
                : { excaliName: '', excaliSrc: '', imgName: '', mimeType: '' },
        [selectedSrc]
    );

    const applyDirHandle = React.useCallback(async (handle: FileSystemDirectoryHandle) => {
        setDirHandle(handle);
        const tree = await buildImageTree(handle);
        setDirTree(tree);
        setSelectedSrc(null);
        setExcaliState(null);
        loadingRef.current = null;
    }, []);

    // Restore previously granted folder on mount
    React.useEffect(() => {
        restoreAccess(FS_STANDALONE_EDITOR_ID, 'readwrite', []).then((handle) => {
            if (handle) {
                applyDirHandle(handle);
            }
        });
    }, [applyDirHandle]);

    const selectFolder = React.useCallback(async () => {
        // Always prompt the user (no cacheKey so the picker always opens)
        const handle = await requestLocalDirectoryAccess(
            'readwrite',
            [],
            'Wähle den Ordner mit den Bildern aus, welche bearbeitet werden sollen.'
        );
        if (!handle) {
            return;
        }
        // Cache for future page loads
        await indexedDb.put('fsHandles', handle, FS_STANDALONE_EDITOR_ID);
        applyDirHandle(handle);
    }, [applyDirHandle]);

    const openImage = React.useCallback(
        async (src: string) => {
            if (!dirHandle || !src) {
                return;
            }
            loadingRef.current = src;
            setSelectedSrc(src);
            setExcaliState(null);
            try {
                const data = await loadExcalidrawState(dirHandle, src);
                if (loadingRef.current !== src) {
                    return;
                }
                setExcaliState(data);
            } catch (error) {
                console.error('Error processing image:', error);
                window.alert(`Error processing image: ${error}`);
            }
        },
        [dirHandle]
    );

    const onSelect = React.useCallback(
        (fName?: string) => {
            if (!fName || !dirTree) {
                return;
            }
            // Dir prepends the root dir name (e.g. "myFolder/tmp/image.png"),
            // but dirHandle already IS that root, so strip the prefix.
            const relativePath = fName.replace(/^\/+/, '').replace(new RegExp(`^${dirTree.name}/`), '');
            if (relativePath && IMAGE_RE.test(relativePath)) {
                openImage(relativePath);
            }
        },
        [openImage, dirTree]
    );

    const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
    const isMobile = useIsMobileView();
    const [mobileTreeOpen, setMobileTreeOpen] = React.useState(false);

    const onMobileSelect = React.useCallback(
        (fName?: string) => {
            onSelect(fName);
            setMobileTreeOpen(false);
        },
        [onSelect]
    );

    return (
        <FullscreenContext.Provider value={id}>
            <div
                id={id}
                className={clsx(
                    styles.standaloneEditor,
                    viewStore.isFullscreenTarget(id) && styles.fullscreen,
                    props.className
                )}
            >
                {isMobile ? (
                    <>
                        {mobileTreeOpen && (
                            <div className={clsx(styles.mobileOverlay)}>
                                <div className={clsx(styles.mobileOverlayHeader)}>
                                    <Button
                                        icon={mdiFolderOpen}
                                        text="Ordner auswählen"
                                        onClick={selectFolder}
                                        color="primary"
                                    />
                                    <button
                                        className={clsx(styles.collapseToggle)}
                                        onClick={() => setMobileTreeOpen(false)}
                                        title="Dateiliste schliessen"
                                    >
                                        <Icon path={mdiClose} size={0.8} />
                                    </button>
                                </div>
                                {dirTree && (
                                    <div className={clsx(styles.fileTree)}>
                                        <Dir
                                            dir={dirTree}
                                            open={2}
                                            path={selectedSrc ? `${dirTree.name}/${selectedSrc}` : undefined}
                                            onSelect={onMobileSelect}
                                        />
                                    </div>
                                )}
                            </div>
                        )}
                        <div className={clsx(styles.mobileToolbar)}>
                            <button
                                className={clsx(styles.collapseToggle)}
                                onClick={() => setMobileTreeOpen(true)}
                                title="Dateiliste anzeigen"
                            >
                                <Icon path={mdiFileTree} size={0.8} />
                            </button>
                            {!dirHandle && (
                                <Button
                                    icon={mdiFolderOpen}
                                    text="Ordner auswählen"
                                    onClick={selectFolder}
                                    color="primary"
                                />
                            )}
                            <RequestFullscreen targetId={id} />
                        </div>
                    </>
                ) : (
                    <div className={clsx(styles.sidebar, sidebarCollapsed && styles.collapsed)}>
                        <div className={clsx(styles.sidebarHeader)}>
                            {!sidebarCollapsed && (
                                <Button
                                    icon={mdiFolderOpen}
                                    text="Ordner auswählen"
                                    onClick={selectFolder}
                                    color="primary"
                                />
                            )}
                            {!sidebarCollapsed && <RequestFullscreen targetId={id} />}
                            <button
                                className={clsx(styles.collapseToggle)}
                                onClick={() => setSidebarCollapsed((prev) => !prev)}
                                title={sidebarCollapsed ? 'Dateiliste einblenden' : 'Dateiliste ausblenden'}
                            >
                                <Icon path={sidebarCollapsed ? mdiChevronRight : mdiChevronLeft} size={0.8} />
                            </button>
                        </div>
                        {!sidebarCollapsed && dirTree && (
                            <div className={clsx(styles.fileTree)}>
                                <Dir
                                    dir={dirTree}
                                    open={2}
                                    path={selectedSrc ? `${dirTree.name}/${selectedSrc}` : undefined}
                                    onSelect={onSelect}
                                />
                            </div>
                        )}
                    </div>
                )}
                <div className={clsx(styles.editorPane)}>
                    {excaliState && selectedSrc ? (
                        <ImageMarkupEditor
                            key={selectedSrc}
                            initialData={excaliState}
                            mimeType={mimeType}
                            onDiscard={() => {
                                setExcaliState(null);
                                setSelectedSrc(null);
                            }}
                            onSave={async (state, blob, asWebp) => {
                                const imgExport = await saveExcalidrawToFs(
                                    dirHandle!,
                                    selectedSrc,
                                    excaliSrc,
                                    imgName,
                                    state,
                                    blob,
                                    asWebp
                                );
                                openImage(imgExport);
                            }}
                            onRestore={async () => {
                                const restored = await restoreExcalidrawFromFs(
                                    dirHandle!,
                                    excaliSrc,
                                    excaliName,
                                    imgName
                                );
                                if (restored) {
                                    setExcaliState(null);
                                    setSelectedSrc(null);
                                }
                            }}
                        />
                    ) : (
                        <div className={clsx(styles.placeholder)}>
                            {dirHandle
                                ? 'Wähle ein Bild aus der Dateiliste aus.'
                                : 'Wähle zuerst einen Ordner aus.'}
                        </div>
                    )}
                </div>
            </div>
        </FullscreenContext.Provider>
    );
});

export default StandaloneEditor;
