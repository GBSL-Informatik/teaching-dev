import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import { useStore } from '@tdev-hooks/useStore';
import Card from '@tdev-components/shared/Card';
import Popup from 'reactjs-popup';
import Button from '@tdev-components/shared/Button';
import { SIZE_S } from '@tdev-components/shared/iconSizes';
import { mdiClose, mdiImageEditOutline } from '@mdi/js';
import ImageMarkupEditor from '..';
import requestDocusaurusRootAcess from '@tdev-components/util/localFS/requestDocusaurusRootAcess';
import requestFileHandle from '@tdev-components/util/localFS/requestFileHandle';
import {
    createExcalidrawMarkup,
    EXCALIDRAW_BACKGROUND_FILE_ID,
    updateRectangleDimensions
} from './createExcalidrawMarkup';
import type { ExcalidrawInitialDataState } from '@excalidraw/excalidraw/types';
import type { PopupActions } from 'reactjs-popup/dist/types';

interface Props {
    src: string;
    className?: string;
}

const extractExcaliSrc = (src: string): [string, string, string] => {
    const path = src.split('/');
    const imgName = path.pop() as string;
    const excaliName = `${imgName}.excalidraw`;
    return [excaliName, `${path.join('/')}/${excaliName}`, imgName];
};

const dataUrlToBlob = (dataUrl: string): Blob => {
    const parts = dataUrl.split(';base64,');
    const contentType = parts[0].split(':')[1];
    const raw = window.atob(parts[1]);
    const rawLength = raw.length;
    const uInt8Array = new Uint8Array(rawLength);

    for (let i = 0; i < rawLength; ++i) {
        uInt8Array[i] = raw.charCodeAt(i);
    }

    return new Blob([uInt8Array], { type: contentType });
};

const EditorPopup = observer((props: Props) => {
    const sessionStore = useStore('sessionStore');
    const ref = React.useRef<PopupActions>(null);
    const [excaliName, excaliSrc, imgName] = React.useMemo(() => extractExcaliSrc(props.src), [props.src]);
    const [excaliState, setExcaliState] = React.useState<ExcalidrawInitialDataState | null>(null);

    return (
        <Popup
            trigger={
                <span className={clsx(props.className)}>
                    <Button icon={mdiImageEditOutline} size={SIZE_S} />
                </span>
            }
            lockScroll
            closeOnEscape={false}
            nested
            closeOnDocumentClick={false}
            onOpen={async () => {
                if (!sessionStore.fileSystemDirectoryHandles.get('root')) {
                    const docRootHandle = await requestDocusaurusRootAcess();
                    if (docRootHandle) {
                        sessionStore.setFileSystemDirectoryHandle('root', docRootHandle);
                    }
                }
                const root = sessionStore.fileSystemDirectoryHandles.get('root');
                if (!root) {
                    window.alert('Kein Zugriff auf lokale Dateien. Bitte aktiviere den Zugriff.');
                    return;
                }
                try {
                    let fileHandle: FileSystemFileHandle;
                    let parentDir: FileSystemDirectoryHandle;
                    try {
                        ({ fileHandle, parentDir } = await requestFileHandle(root, excaliSrc, 'readwrite'));
                    } catch (error) {
                        // If the file does not exist, create a new one
                        ({ fileHandle, parentDir } = await requestFileHandle(root, props.src, 'read'));
                        const excaliData = await createExcalidrawMarkup(fileHandle);
                        const excaliFile = await parentDir.getFileHandle(excaliName, { create: true });
                        await excaliFile.createWritable().then(async (writable) => {
                            await writable.write(JSON.stringify(excaliData, null, 2));
                            await writable.close();
                        });
                        fileHandle = excaliFile;
                    }
                    const data = await fileHandle
                        .getFile()
                        .then((content) => {
                            return content.text();
                        })
                        .then((text) => JSON.parse(text) as ExcalidrawInitialDataState);
                    setExcaliState(updateRectangleDimensions(data));
                } catch (error) {
                    console.error('Error processing image:', error);
                    window.alert(`Error processing image: ${error}`);
                }
            }}
            onClose={() => {
                setExcaliState(null);
            }}
            ref={ref}
            modal
            on="click"
            overlayStyle={{ background: 'rgba(0,0,0,0.5)' }}
        >
            <Card
                classNames={{ body: clsx(styles.body), card: clsx(styles.card) }}
                header={
                    <div className={clsx(styles.header)}>
                        <h3>Bild bearbeiten</h3>
                        <Button
                            icon={mdiClose}
                            text="Schliessen"
                            onClick={() => {
                                ref.current?.close();
                            }}
                        />
                    </div>
                }
            >
                {excaliState && (
                    <ImageMarkupEditor
                        initialData={excaliState}
                        onDiscard={() => {
                            ref.current?.close();
                        }}
                        onSave={async (state, blob, asWebp) => {
                            const root = sessionStore.fileSystemDirectoryHandles.get('root');
                            let exaliExport = excaliSrc;
                            let imgExport = props.src;
                            const needsTransform = asWebp && !/\.webp$/i.test(props.src);
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
                                root!,
                                exaliExport,
                                'readwrite',
                                true
                            );
                            const { fileHandle: imgHandle } = await requestFileHandle(
                                root!,
                                imgExport,
                                'readwrite',
                                true
                            );
                            await fileHandle.createWritable().then(async (writable) => {
                                await writable.write(JSON.stringify(state, null, 2));
                                await writable.close();
                            });
                            await imgHandle.createWritable().then(async (writable) => {
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
                            ref.current?.close();
                        }}
                        onRestore={async () => {
                            const root = sessionStore.fileSystemDirectoryHandles.get('root');
                            const { fileHandle, parentDir } = await requestFileHandle(
                                root!,
                                excaliSrc,
                                'read'
                            );
                            const data = await fileHandle
                                .getFile()
                                .then((content) => content.text())
                                .then((text) => JSON.parse(text) as ExcalidrawInitialDataState);
                            const backgroundFile = data.files?.[EXCALIDRAW_BACKGROUND_FILE_ID];
                            if (backgroundFile) {
                                const imgHandle = await parentDir.getFileHandle(imgName, { create: true });
                                await imgHandle.createWritable().then(async (writable) => {
                                    await writable.write(dataUrlToBlob(backgroundFile.dataURL));
                                    await writable.close();
                                });
                                await parentDir.removeEntry(excaliName);
                                ref.current?.close();
                            }
                        }}
                    />
                )}
            </Card>
        </Popup>
    );
});

export default EditorPopup;
