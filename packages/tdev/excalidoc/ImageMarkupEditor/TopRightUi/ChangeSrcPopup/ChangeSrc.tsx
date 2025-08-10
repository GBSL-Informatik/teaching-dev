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
    type CustomData,
    EXCALIDRAW_BACKGROUND_FILE_ID,
    EXCALIDRAW_BACKGROUND_IMAGE_ID,
    EXCALIDRAW_IMAGE_RECTANGLE_ID,
    EXCALIDRAW_MAX_WIDTH
} from '@tdev/excalidoc/ImageMarkupEditor/helpers/constants';
import { OrderedExcalidrawElement } from '@excalidraw/excalidraw/element/types';
import getImageDimensions from '@tdev-components/util/localFS/getImageDimensions';
import { SIZE_S } from '@tdev-components/shared/iconSizes';
import Alert from '@tdev-components/shared/Alert';
import {
    getImageElementFromScene,
    getImageFileFromScene,
    getRectangleElementFromScene
} from '@tdev/excalidoc/ImageMarkupEditor/helpers/getElementsFromScene';

interface Props {
    api: ExcalidrawImperativeAPI;
    onClose: () => void;
    updateScene: (appState: ExcalidrawInitialDataState) => void;
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
            const dimensions = await getImageDimensions(image, EXCALIDRAW_MAX_WIDTH);
            const currentElements = props.api.getSceneElementsIncludingDeleted();
            const [imgElement, imgIdx] = getImageElementFromScene(currentElements);
            const [rectElement, rectIdx] = getRectangleElementFromScene(currentElements);
            const currentFiles = props.api.getFiles();
            const imgFile = getImageFileFromScene(currentFiles);
            if (!imgElement || !imgFile || !rectElement) {
                console.error(
                    `Corrupt excalidraw scene! Ensure the Elements "${EXCALIDRAW_BACKGROUND_IMAGE_ID}" and "${EXCALIDRAW_IMAGE_RECTANGLE_ID}" and the File "${EXCALIDRAW_BACKGROUND_FILE_ID}" are present!`
                );
                return;
            }

            const all = [...currentElements];
            all.splice(imgIdx, 1, {
                ...imgElement,
                customData: {
                    ...(imgElement.customData as CustomData),
                    scale: dimensions.scale,
                    initExtension: `.${image.name.split('.').pop() || 'png'}`
                } satisfies CustomData,
                width: dimensions.width,
                height: dimensions.height,
                scale: [1, 1],
                isDeleted: false,
                versionNonce: (imgElement.versionNonce || 1) + 1,
                locked: true
            } as OrderedExcalidrawElement);
            all.splice(rectIdx, 1, {
                ...rectElement,
                x: imgElement.x,
                y: imgElement.y,
                width: dimensions.width,
                height: dimensions.height,
                isDeleted: false,
                versionNonce: (imgElement.versionNonce || 1) + 1,
                locked: true
            } as OrderedExcalidrawElement);
            props.updateScene({
                type: 'excalidraw',
                version: 2,
                elements: all,
                appState: {},
                files: {
                    ...props.api.getFiles(),
                    [EXCALIDRAW_BACKGROUND_FILE_ID]: {
                        ...imgFile,
                        dataURL: data,
                        mimeType: image.type
                    } as BinaryFileData
                }
            });
            props.onClose();
        },
        [props.api, props.updateScene]
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
