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
import type { ExcalidrawInitialDataState } from '@excalidraw/excalidraw/types';
import extractExalidrawImageName from '../helpers/extractExalidrawImageName';
import type { DirType } from '@tdev-components/FileSystem/Dir';
import { FullscreenContext } from '@tdev-hooks/useFullscreenTargetId';
import loadExcalidrawState from '../helpers/loadExcalidrawState';
import saveExcalidrawToFs from '../helpers/saveExcalidrawToFs';
import restoreExcalidrawFromFs from '../helpers/restoreExcalidrawFromFs';
import { IMAGE_RE, NEW_EXCALIDRAW_DRAWING, VALID_EXPORT_EXTENSIONS } from '../helpers/constants';
import writeFileHandle from '../helpers/writeFileHandle';
import buildImageTree from '../helpers/buildImageTree';
import requestFileHandle from '@tdev-components/util/localFS/requestFileHandle';
import useCreateNewDrawing from '../hooks/useCreateNewDrawing';
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

    const createNewDrawing = useCreateNewDrawing(dirHandle, setDirTree, setSelectedSrc, setExcaliState);

    const renameImage = React.useCallback(async () => {
        if (!dirHandle || !selectedSrc) {
            return;
        }
        const currentName = selectedSrc.split('/').pop() || selectedSrc;
        const currentExt = currentName.substring(currentName.lastIndexOf('.'));
        const baseName = currentName.substring(0, currentName.lastIndexOf('.'));
        const input = window.prompt(`Neuer Dateiname (${currentExt}):`, baseName);
        if (!input) {
            return;
        }
        const newBase = input.trim();
        if (!newBase || newBase === baseName) {
            return;
        }
        const newName = `${newBase}${currentExt}`;
        const pathParts = selectedSrc.split('/');
        pathParts.pop();
        const newSrc = pathParts.length > 0 ? `${pathParts.join('/')}/${newName}` : newName;
        try {
            // Check if target already exists
            try {
                await requestFileHandle(dirHandle, newSrc, 'read', false);
                window.alert(`Die Datei "${newName}" existiert bereits.`);
                return;
            } catch {
                // Expected – target doesn't exist
            }
            // Copy image file
            const { fileHandle: oldImgHandle, parentDir } = await requestFileHandle(
                dirHandle,
                selectedSrc,
                'readwrite',
                false
            );
            const oldImgFile = await oldImgHandle.getFile();
            const newImgHandle = await parentDir.getFileHandle(newName, { create: true });
            await writeFileHandle(newImgHandle, await oldImgFile.arrayBuffer());
            await parentDir.removeEntry(currentName);
            // Copy excalidraw sidecar if it exists
            try {
                const { fileHandle: oldExcaliHandle } = await requestFileHandle(
                    dirHandle,
                    excaliSrc,
                    'readwrite',
                    false
                );
                const oldExcaliFile = await oldExcaliHandle.getFile();
                const newExcaliHandle = await parentDir.getFileHandle(`${newName}.excalidraw`, {
                    create: true
                });
                await writeFileHandle(newExcaliHandle, await oldExcaliFile.text());
                await parentDir.removeEntry(excaliName);
            } catch {
                // No sidecar – that's fine
            }
            // Refresh tree and open renamed image
            const tree = await buildImageTree(dirHandle);
            setDirTree(tree);
            openImage(newSrc);
        } catch (error) {
            console.error('Error renaming image:', error);
            window.alert(`Fehler beim Umbenennen: ${error}`);
        }
    }, [dirHandle, selectedSrc, excaliSrc, excaliName, openImage]);

    const isMobile = useIsMobileView();

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
                                const imgExport = await saveExcalidrawToFs(
                                    dirHandle!,
                                    selectedSrc,
                                    excaliSrc,
                                    imgName,
                                    state,
                                    blob,
                                    asWebp
                                );
                                // Refresh tree so newly created images appear
                                const tree = await buildImageTree(dirHandle!);
                                setDirTree(tree);
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
    );
});

export default StandaloneEditor;
