import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import {
    mdiButtonCursor,
    mdiClipboardFileOutline,
    mdiClose,
    mdiCloudArrowUpOutline,
    mdiFileUploadOutline
} from '@mdi/js';
import Card from '@tdev-components/shared/Card';
import Button from '@tdev-components/shared/Button';
import Icon from '@mdi/react';
import type {
    BinaryFileData,
    ExcalidrawImperativeAPI,
    ExcalidrawInitialDataState
} from '@excalidraw/excalidraw/types';
import fileToDataUrl from '@tdev-components/util/localFS/fileToDataUrl';
import {
    EXCALIDRAW_BACKGROUND_FILE,
    EXCALIDRAW_BACKGROUND_IMAGE,
    EXCALIDRAW_BACKGROUND_IMAGE_ID
} from '../../helpers/constants';
import { ExcalidrawImageElement, OrderedExcalidrawElement } from '@excalidraw/excalidraw/element/types';
import getImageDimensions from '@tdev-components/util/localFS/getImageDimensions';
import { SIZE_S } from '@tdev-components/shared/iconSizes';
import Alert from '@tdev-components/shared/Alert';

interface Props {
    api: ExcalidrawImperativeAPI;
    onClose: () => void;
    onReload: (appState: ExcalidrawInitialDataState) => void;
    className?: string;
}

const ChangeSrc = (props: Props) => {
    const [isDragOver, setIsDragOver] = React.useState(false);
    const labelRef = React.useRef<HTMLLabelElement>(null);
    const [clipboardInfo, setClipboardInfo] = React.useState<string | null>(null);

    const inputId = React.useId();
    const labelId = React.useId();

    const handleFile = React.useCallback(
        async (image: File) => {
            if (!image) {
                return;
            }
            setClipboardInfo(null);
            const data = await fileToDataUrl(image);
            const dimensions = await getImageDimensions(image);
            const currentElements = props.api.getSceneElementsIncludingDeleted();
            const imgElement = (currentElements.find(
                (e) => e.id === EXCALIDRAW_BACKGROUND_IMAGE_ID
            ) as ExcalidrawImageElement) || {
                ...EXCALIDRAW_BACKGROUND_IMAGE
            };
            const currentFiles = props.api.getFiles();
            const imgFile = currentFiles[imgElement.fileId!] || EXCALIDRAW_BACKGROUND_FILE;
            const newImageFile = {
                ...imgFile,
                dataURL: data,
                mimeType: image.type
            } as BinaryFileData;

            const newImgElement = {
                ...imgElement,
                fileId: newImageFile.id,
                width: dimensions.width,
                height: dimensions.height,
                scale: [1, 1],
                isDeleted: false,
                versionNonce: (imgElement.versionNonce || 1) + 1,
                locked: true
            } as ExcalidrawImageElement;
            const all = [...currentElements];
            const imgIdx = all.findIndex((e) => e.id === newImgElement.id);
            if (imgIdx === -1) {
                all.splice(0, 0, newImgElement as OrderedExcalidrawElement);
            } else {
                all.splice(imgIdx, 1, newImgElement as OrderedExcalidrawElement);
            }
            props.onReload({
                type: 'excalidraw',
                version: 2,
                elements: all,
                appState: {},
                files: {
                    ...props.api.getFiles(),
                    [newImageFile.id]: newImageFile
                }
            });
            props.onClose();
        },
        [props.api, props.onReload]
    );

    const handlePaste = React.useCallback(
        (event: ClipboardEvent) => {
            const items = event.clipboardData?.items;
            if (!items) {
                setClipboardInfo('Aktuell befindet sich kein Inhalt in der Zwischenablage.');
                return;
            }
            const image = Array.from(items).find((item) => item.type.startsWith('image/'));
            if (!image) {
                setClipboardInfo('Keine Bilder in der Zwischenablage gefunden.');
                return;
            }
            event.preventDefault(); // Prevent default paste
            const blob = image.getAsFile();
            if (blob) {
                handleFile(blob);
            }
        },
        [handleFile]
    );

    const handleFileChange: React.ChangeEventHandler<HTMLInputElement> = React.useCallback(
        (event) => {
            const selectedFiles = event.target.files;
            if (selectedFiles && selectedFiles.length > 0) {
                const newFiles = Array.from(selectedFiles);
                const image = newFiles.find((file) => file.type.startsWith('image/'));
                handleFile(image!);
            }
        },
        [handleFile]
    );

    const handleDrop: React.DragEventHandler<HTMLDivElement> = React.useCallback(
        async (event) => {
            event.preventDefault();
            setIsDragOver(false);
            const droppedFiles = event.dataTransfer.files;
            if (droppedFiles.length > 0) {
                const newFiles = Array.from(droppedFiles);
                const image = newFiles.find((file) => file.type.startsWith('image/'));
                handleFile(image!);
            }
        },
        [handleFile]
    );

    React.useEffect(() => {
        document.addEventListener('paste', handlePaste);
        return () => {
            document.removeEventListener('paste', handlePaste);
        };
    }, [handlePaste]);

    return (
        <Card
            classNames={{ header: styles.header, card: styles.card }}
            header={
                <>
                    <h3>Hintergrundbild ändern</h3>
                    <Button icon={mdiClose} text="Schliessen" onClick={props.onClose} />
                </>
            }
        >
            <div
                className={clsx(styles.documentUploader, styles.uploadBox, isDragOver && styles.dragover)}
                onDrop={handleDrop}
                onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onClick={(e) => {
                    if (labelRef.current && e.target !== labelRef.current) {
                        labelRef.current.click();
                    }
                }}
            >
                <>
                    <div className={clsx(styles.uploadInfo)}>
                        <Icon path={mdiCloudArrowUpOutline} size={1} color="var(--ifm-color-primary)" />
                        <div className={clsx(styles.info)}>
                            <h4>Bildquelle ändern</h4>
                            <ul>
                                <li>
                                    <Icon
                                        path={mdiFileUploadOutline}
                                        size={SIZE_S}
                                        color="var(--ifm-color-primary)"
                                    />
                                    Bild hochladen
                                </li>
                                <li>
                                    <Icon
                                        path={mdiButtonCursor}
                                        size={SIZE_S}
                                        color="var(--ifm-color-primary)"
                                    />
                                    Bild per Drag & Drop hier ablegen
                                </li>
                                <li>
                                    <Icon
                                        path={mdiClipboardFileOutline}
                                        size={SIZE_S}
                                        color="var(--ifm-color-primary)"
                                    />
                                    Bild per Copy & Paste einfügen
                                    {clipboardInfo && (
                                        <Alert
                                            className={clsx(styles.alert)}
                                            type="warning"
                                            onDiscard={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                setClipboardInfo(null);
                                            }}
                                        >
                                            {clipboardInfo}
                                        </Alert>
                                    )}
                                    <Button
                                        icon={mdiClipboardFileOutline}
                                        text="Einfügen"
                                        iconSide="left"
                                        color="orange"
                                        noOutline
                                        size={SIZE_S}
                                        className={clsx(styles.clipboardButton)}
                                        onClick={async (e) => {
                                            e.stopPropagation();
                                            e.preventDefault();
                                            const items = await navigator.clipboard.read();
                                            if (!items) {
                                                setClipboardInfo(
                                                    'Aktuell befindet sich kein Inhalt in der Zwischenablage.'
                                                );

                                                return;
                                            }
                                            const image = Array.from(items).find((item) =>
                                                item.types.some((e) => e.startsWith('image/'))
                                            );
                                            if (!image) {
                                                setClipboardInfo(
                                                    'Keine Bilder in der Zwischenablage gefunden.'
                                                );
                                                return;
                                            }
                                            const mimeType = image.types.find((e) => e.startsWith('image/'));
                                            const blob = await image.getType(mimeType!);
                                            if (!blob) {
                                                setClipboardInfo(
                                                    'Keine Bilder in der Zwischenablage gefunden.'
                                                );
                                                return;
                                            }
                                            const file = new File([blob], 'clipboard-content', {
                                                type: blob.type
                                            });
                                            handleFile(file);
                                        }}
                                    />
                                </li>
                            </ul>
                        </div>
                    </div>
                    <input type="file" hidden id={inputId} onChange={handleFileChange} accept="image/*" />
                    <label
                        id={labelId}
                        htmlFor={inputId}
                        className={clsx('button button--primary', styles.browseBtn)}
                        ref={labelRef}
                    >
                        Durchsuchen
                    </label>
                </>
            </div>
        </Card>
    );
};

export default ChangeSrc;
