import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import { useStore } from '@tdev-hooks/useStore';
import useIsMobileView from '@tdev-hooks/useIsMobileView';
import ImageMarkupEditor from '..';
import requestLocalDirectoryAccess, {
    restoreAccess
} from '@tdev-components/util/localFS/requestLocalDirectoryAccess';
import { indexedDb } from '@tdev-api/base';
import type { DirType } from '@tdev-components/FileSystem/Dir';
import { FullscreenContext } from '@tdev-hooks/useFullscreenTargetId';
import { IMAGE_RE } from '../helpers/constants';
import buildImageTree from '../helpers/buildImageTree';
import useCreateNewDrawing from '../hooks/useCreateNewDrawing';
import useRenameImage from '../hooks/useRenameImage';
import useExcalidrawSource from '../hooks/useExcalidrawSource';
import Alert from '@tdev-components/shared/Alert';
import DesktopSidebar from './DesktopSidebar';
import MobileSidebar from './MobileSidebar';

interface Props {
    className?: string;
}

const FS_STANDALONE_EDITOR_ID = 'excalidraw-standalone-editor';

const StandaloneEditor = observer((props: Props) => {
    const id = React.useId();
    const viewStore = useStore('viewStore');
    const [dirHandle, setDirHandle] = React.useState<FileSystemDirectoryHandle | null>(null);
    const [dirTree, setDirTree] = React.useState<DirType | null>(null);
    const [selectedSrc, setSelectedSrc] = React.useState<string | null>(null);
    const loadingRef = React.useRef<string | null>(null);

    const [canUseFileSystemAccessAPI, setCanUseFileSystemAccessAPI] = React.useState(false);

    React.useEffect(() => {
        setCanUseFileSystemAccessAPI('showDirectoryPicker' in window);
    }, []);

    const { excaliState, setExcaliState, excaliName, excaliSrc, mimeType, load, save, restore } =
        useExcalidrawSource(dirHandle, selectedSrc);

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
            await load(src);
        },
        [dirHandle, load, setExcaliState]
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

    const createNewDrawing = useCreateNewDrawing(dirHandle, setDirTree, setSelectedSrc, setExcaliState);

    const renameImage = useRenameImage(dirHandle, selectedSrc, excaliSrc, excaliName, setDirTree, openImage);

    const isMobile = useIsMobileView();

    return (
        <>
            {!canUseFileSystemAccessAPI && (
                <Alert type="warning">
                    ⚠️ Die File System API ist nicht unterstützt. Verwenden Sie Chrome oder Edge.
                </Alert>
            )}
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
                        <MobileSidebar
                            fullscreenTargetId={id}
                            dirHandle={dirHandle}
                            dirTree={dirTree}
                            selectedSrc={selectedSrc}
                            onSelectFolder={selectFolder}
                            onSelect={onSelect}
                            onCreateNewDrawing={createNewDrawing}
                            onRenameImage={renameImage}
                        />
                    ) : (
                        <DesktopSidebar
                            fullscreenTargetId={id}
                            dirHandle={dirHandle}
                            dirTree={dirTree}
                            selectedSrc={selectedSrc}
                            onSelectFolder={selectFolder}
                            onSelect={onSelect}
                            onCreateNewDrawing={createNewDrawing}
                            onRenameImage={renameImage}
                        />
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
                                    const imgExport = await save(state, blob, asWebp);
                                    // Refresh tree so newly created images appear
                                    const tree = await buildImageTree(dirHandle!);
                                    setDirTree(tree);
                                    if (imgExport) {
                                        openImage(imgExport);
                                    }
                                }}
                                onRestore={async () => {
                                    const restored = await restore();
                                    if (restored) {
                                        const tree = await buildImageTree(dirHandle!);
                                        setDirTree(tree);
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
        </>
    );
});

export default StandaloneEditor;
