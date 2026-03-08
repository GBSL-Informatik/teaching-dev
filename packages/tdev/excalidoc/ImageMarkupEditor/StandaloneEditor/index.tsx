import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import Button from '@tdev-components/shared/Button';
import { mdiFolderOpen } from '@mdi/js';
import ImageMarkupEditor from '..';
import requestLocalDirectoryAccess from '@tdev-components/util/localFS/requestLocalDirectoryAccess';
import requestFileHandle from '@tdev-components/util/localFS/requestFileHandle';
import { createExcalidrawMarkup, updateRectangleDimensions } from '../helpers/createExcalidrawMarkup';
import type { ExcalidrawInitialDataState } from '@excalidraw/excalidraw/types';
import extractExalidrawImageName from '../helpers/extractExalidrawImageName';
import dataUrlToBlob from '../helpers/dataUrlToBlob';
import { getImageElementFromScene, getImageFileFromScene } from '../helpers/getElementsFromScene';
import type { OrderedExcalidrawElement } from '@excalidraw/excalidraw/element/types';
import { CustomData } from '../helpers/constants';
import Dir, { DirType } from '@tdev-components/FileSystem/Dir';

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
    const [dirHandle, setDirHandle] = React.useState<FileSystemDirectoryHandle | null>(null);
    const [dirTree, setDirTree] = React.useState<DirType | null>(null);
    const [selectedSrc, setSelectedSrc] = React.useState<string | null>(null);
    const [excaliState, setExcaliState] = React.useState<ExcalidrawInitialDataState | null>(null);

    const { excaliName, excaliSrc, imgName, mimeType } = React.useMemo(
        () =>
            selectedSrc
                ? extractExalidrawImageName(selectedSrc)
                : { excaliName: '', excaliSrc: '', imgName: '', mimeType: '' },
        [selectedSrc]
    );

    const selectFolder = React.useCallback(async () => {
        const handle = await requestLocalDirectoryAccess(
            'readwrite',
            [],
            'Wähle den Ordner mit den Bildern aus, welche bearbeitet werden sollen.',
            FS_STANDALONE_EDITOR_ID
        );
        if (!handle) {
            return;
        }
        setDirHandle(handle);
        const tree = await buildImageTree(handle);
        setDirTree(tree);
        setSelectedSrc(null);
        setExcaliState(null);
    }, []);

    const openImage = React.useCallback(
        async (src: string) => {
            if (!dirHandle || !src) {
                return;
            }
            setSelectedSrc(src);
            const { excaliSrc: eSrc, excaliName: eName } = extractExalidrawImageName(src);
            try {
                let fileHandle: FileSystemFileHandle;
                let parentDir: FileSystemDirectoryHandle;
                try {
                    ({ fileHandle, parentDir } = await requestFileHandle(dirHandle, eSrc, 'readwrite'));
                } catch {
                    // excalidraw file doesn't exist yet – create from image
                    ({ fileHandle, parentDir } = await requestFileHandle(dirHandle, src, 'read'));
                    const excaliData = await createExcalidrawMarkup(fileHandle);
                    const excaliFile = await parentDir.getFileHandle(eName, { create: true });
                    await excaliFile.createWritable().then(async (writable) => {
                        await writable.write(JSON.stringify(excaliData, null, 2));
                        await writable.close();
                    });
                    fileHandle = excaliFile;
                }
                const data = await fileHandle
                    .getFile()
                    .then((content) => content.text())
                    .then((text) => JSON.parse(text) as ExcalidrawInitialDataState);
                setExcaliState(updateRectangleDimensions(data));
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

    return (
        <div className={clsx(styles.standaloneEditor, props.className)}>
            <div className={clsx(styles.sidebar)}>
                <div className={clsx(styles.sidebarHeader)}>
                    <Button
                        icon={mdiFolderOpen}
                        text="Ordner auswählen"
                        onClick={selectFolder}
                        color="primary"
                    />
                </div>
                {dirTree && (
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
                            let exaliExport = excaliSrc;
                            let imgExport = selectedSrc;
                            const needsTransform = asWebp && !/\.webp$/i.test(selectedSrc);
                            if (needsTransform) {
                                exaliExport = exaliExport.replace(
                                    `${imgName}.excalidraw`,
                                    `${imgName.split('.').slice(0, -1).join('.')}.webp.excalidraw`
                                );
                                imgExport = imgExport.replace(
                                    `${imgName}`,
                                    `${imgName.split('.').slice(0, -1).join('.')}.webp`
                                );
                            }

                            const { fileHandle, parentDir } = await requestFileHandle(
                                dirHandle!,
                                exaliExport,
                                'readwrite',
                                true
                            );
                            const { fileHandle: imgFileHandle } = await requestFileHandle(
                                dirHandle!,
                                imgExport,
                                'readwrite',
                                true
                            );
                            await fileHandle.createWritable().then(async (writable) => {
                                await writable.write(JSON.stringify(state, null, 2));
                                await writable.close();
                            });
                            await imgFileHandle.createWritable().then(async (writable) => {
                                await writable.write(blob);
                                await writable.close();
                            });
                            if (needsTransform) {
                                try {
                                    await parentDir.removeEntry(imgName);
                                    await parentDir.removeEntry(`${imgName}.excalidraw`);
                                } catch (err) {
                                    console.error(`Error removing entry when transforming to WebP:`, err);
                                }
                            }
                        }}
                        onRestore={async () => {
                            const { fileHandle, parentDir } = await requestFileHandle(
                                dirHandle!,
                                excaliSrc,
                                'read'
                            );
                            const data = await fileHandle
                                .getFile()
                                .then((content) => content.text())
                                .then((text) => JSON.parse(text) as ExcalidrawInitialDataState);
                            const [backgroundImage] = getImageElementFromScene(
                                data.elements as readonly OrderedExcalidrawElement[]
                            );
                            const backgroundFile = getImageFileFromScene(data.files);
                            if (backgroundFile && backgroundImage) {
                                const cData = backgroundImage.customData as Partial<CustomData>;
                                const initExtension = cData.initExtension || '.png';
                                const restoredName = imgName.endsWith(initExtension)
                                    ? imgName
                                    : `${imgName.split('.').slice(0, -1).join('.')}${initExtension}`;
                                const imgFileHandle = await parentDir.getFileHandle(restoredName, {
                                    create: true
                                });
                                await imgFileHandle.createWritable().then(async (writable) => {
                                    await writable.write(dataUrlToBlob(backgroundFile.dataURL));
                                    await writable.close();
                                });
                                await parentDir.removeEntry(excaliName);
                                if (restoredName !== imgName) {
                                    await parentDir.removeEntry(imgName);
                                }
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
    );
});

export default StandaloneEditor;
