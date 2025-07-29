import React from 'react';
import type * as ExcalidrawLib from '@excalidraw/excalidraw';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { PopupActions } from 'reactjs-popup/dist/types';
import Popup from 'reactjs-popup';
import {
    mdiClose,
    mdiCloudArrowUpOutline,
    mdiContentSave,
    mdiImageMove,
    mdiRestoreAlert,
    mdiUploadCircleOutline
} from '@mdi/js';
import Card from '@tdev-components/shared/Card';
import Button from '@tdev-components/shared/Button';
import Icon from '@mdi/react';
import type {
    BinaryFileData,
    ExcalidrawImperativeAPI,
    ExcalidrawInitialDataState
} from '@excalidraw/excalidraw/types';
import dataUrlToBlob from '../../helpers/dataUrlToBlob';
import fileToDataUrl from '@tdev-components/util/localFS/fileToDataUrl';
import {
    EXCALIDRAW_BACKGROUND_FILE,
    EXCALIDRAW_BACKGROUND_IMAGE,
    EXCALIDRAW_BACKGROUND_IMAGE_ID
} from '../../helpers/constants';
import { ExcalidrawImageElement, OrderedExcalidrawElement } from '@excalidraw/excalidraw/element/types';
import getImageDimensions from '@tdev-components/util/localFS/getImageDimensions';

interface Props {
    api: ExcalidrawImperativeAPI;
    onReload: (appState: ExcalidrawInitialDataState) => void;
    className?: string;
}

const ChangeSrcPopup = (props: Props) => {
    const ref = React.useRef<PopupActions>(null);
    const [isDragOver, setIsDragOver] = React.useState(false);
    const labelRef = React.useRef<HTMLLabelElement>(null);
    const [isOpen, setIsOpen] = React.useState(false);

    const inputId = React.useId();
    const labelId = React.useId();

    const handleFile = React.useCallback(
        async (image: File) => {
            if (!image) {
                return;
            }
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
            ref.current?.close();
        },
        [props.api, props.onReload]
    );

    const handleFileChange: React.ChangeEventHandler<HTMLInputElement> = (event) => {
        const selectedFiles = event.target.files;
        if (selectedFiles && selectedFiles.length > 0) {
            const newFiles = Array.from(selectedFiles);
            const image = newFiles.find((file) => file.type.startsWith('image/'));
            handleFile(image!);
        }
    };

    const handleDrop: React.DragEventHandler<HTMLDivElement> = async (event) => {
        event.preventDefault();
        setIsDragOver(false);
        const droppedFiles = event.dataTransfer.files;
        if (droppedFiles.length > 0) {
            const newFiles = Array.from(droppedFiles);
            const image = newFiles.find((file) => file.type.startsWith('image/'));
            handleFile(image!);
        }
    };
    return (
        <Popup
            trigger={
                <span className={clsx(props.className)}>
                    <Button icon={mdiUploadCircleOutline} active={isOpen} size={0.7} title="Bild ändern" />
                </span>
            }
            ref={ref}
            onOpen={() => setIsOpen(true)}
            onClose={() => setIsOpen(false)}
            closeOnDocumentClick={false}
            modal
            on="click"
            overlayStyle={{ background: 'rgba(0,0,0,0.5)' }}
            nested
        >
            <Card
                classNames={{ header: styles.header, card: styles.card }}
                header={
                    <>
                        <h3>Bild ändern</h3>
                        <Button
                            icon={mdiClose}
                            text="Schliessen"
                            onClick={() => {
                                ref.current?.close();
                            }}
                        />
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
                                <p>Bildquelle ändern</p>
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
        </Popup>
    );
};

export default ChangeSrcPopup;
