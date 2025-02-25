import React, { useEffect, useId, useState } from 'react';
import styles from './styles.module.scss';
import Icon from '@mdi/react';
import { mdiCheckCircle, mdiCloudArrowUpOutline } from '@mdi/js';
import clsx from 'clsx';
import ImagePreview from '@tdev-components/Cms/Github/iFile/File/FilePreview/ImagePreview';
import Button from '../Button';
import { observer } from 'mobx-react-lite';
import { useStore } from '@tdev-hooks/useStore';
import { resolvePath } from '@tdev-models/helpers/resolvePath';
import { default as CmsFile } from '@tdev-models/cms/File';
import TextInput from '../TextInput';
import Checkbox from '../Checkbox';
import BinFile from '@tdev-models/cms/BinFile';

const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const base64String = (reader.result as string).split(',')[1];
            resolve(base64String);
        };
        reader.onerror = (error) => reject(error);
    });
};

const toMb = (bytes: number): number => {
    return Math.round((100 * bytes) / 1024 / 1024) / 100;
};
interface Props {
    onFilesUploaded: (files: CmsFile | BinFile) => void;
    accept: string;
    className?: string;
    description?: string;
}

const FileUpload = observer((props: Props) => {
    const [files, setFiles] = useState<File[]>([]);
    const [isDragOver, setIsDragOver] = useState(false);
    const labelRef = React.useRef<HTMLLabelElement>(null);
    const cmsStore = useStore('cmsStore');
    const { activeEntry } = cmsStore;
    const [uploadName, setUploadName] = React.useState('');
    const [compress, setCompress] = React.useState(true);

    const inputId = useId();
    const labelId = useId();
    if (!activeEntry) {
        return null;
    }

    const handleFileChange: React.ChangeEventHandler<HTMLInputElement> = (event) => {
        const selectedFiles = event.target.files;
        if (selectedFiles && selectedFiles.length > 0) {
            const newFiles = Array.from(selectedFiles);
            setUploadName(newFiles[0].name);
            setFiles(newFiles);
        }
    };

    const handleDrop: React.DragEventHandler<HTMLDivElement> = (event) => {
        event.preventDefault();
        setIsDragOver(false);
        const droppedFiles = event.dataTransfer.files;
        if (droppedFiles.length > 0) {
            const newFiles = Array.from(droppedFiles);
            setUploadName(newFiles[0].name);
            setFiles(newFiles);
        }
    };

    return (
        <section className={clsx(styles.dragDrop)}>
            <div
                className={clsx(
                    styles.documentUploader,
                    styles.uploadBox,
                    files.length > 0 && styles.active,
                    isDragOver && styles.dragover
                )}
                onDrop={handleDrop}
                onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onClick={(e) => {
                    if (files.length === 0 && labelRef.current && e.target !== labelRef.current) {
                        labelRef.current.click();
                    }
                }}
            >
                <>
                    <div className={clsx(styles.uploadInfo)}>
                        <Icon path={mdiCloudArrowUpOutline} size={1} color="var(--ifm-color-primary)" />
                        <div className={clsx(styles.info)}>
                            <p>{props.description || 'Dateien per Drag&Drop hochladen'}</p>
                            <p>Max. Dateigrösse: 30MB</p>
                        </div>
                    </div>
                    <input
                        type="file"
                        hidden
                        id={inputId}
                        onChange={handleFileChange}
                        accept={props.accept}
                    />
                    <label
                        id={labelId}
                        htmlFor={inputId}
                        className={clsx('button button--primary', styles.browseBtn)}
                        ref={labelRef}
                    >
                        Durchsuchen
                    </label>
                </>

                {files.length > 0 && (
                    <div className={clsx(styles.fileList)}>
                        <div className={clsx(styles.fileList__container)}>
                            {files.map((file, index) => (
                                <div className={clsx(styles.fileItem)} key={index}>
                                    <div className={clsx(styles.fileInfo)}>
                                        {file.type.startsWith('image/') ? (
                                            <ImagePreview
                                                src={URL.createObjectURL(file)}
                                                fileName={file.name}
                                            />
                                        ) : (
                                            <span>{file.name}</span>
                                        )}
                                        {file.size && <span>{toMb(file.size)} MB</span>}
                                        {file.type.startsWith('image/') && file.type !== 'image/svg+xml' && (
                                            <Checkbox
                                                checked={compress}
                                                onChange={(ck) => setCompress(ck)}
                                                label="Komprimieren auf < 1MB"
                                            />
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <TextInput
                            label="Bildnamen"
                            type="text"
                            onChange={(name) => {
                                setUploadName(name);
                            }}
                            value={uploadName}
                        />
                    </div>
                )}

                {files.length > 0 && (
                    <Button
                        onClick={() => {
                            if (files[0].type.startsWith('image/')) {
                                const imgDir = activeEntry.parent.imageDirPath;
                                if (compress) {
                                    cmsStore
                                        .uploadImage(
                                            files[0],
                                            resolvePath(imgDir, uploadName),
                                            activeEntry.branch,
                                            undefined,
                                            1
                                        )
                                        .then((uploadedFile) => {
                                            if (uploadedFile && uploadedFile.type !== 'file_stub') {
                                                props.onFilesUploaded(uploadedFile);
                                            }
                                        });
                                } else {
                                    files[0]
                                        .arrayBuffer()
                                        .then((content) => {
                                            return cmsStore.github?.createOrUpdateFile(
                                                resolvePath(imgDir, uploadName),
                                                new Uint8Array(content),
                                                activeEntry.branch,
                                                undefined,
                                                `Upload ${uploadName}`
                                            );
                                        })
                                        .then((uploadedFile) => {
                                            if (uploadedFile && uploadedFile.type !== 'file_stub') {
                                                props.onFilesUploaded(uploadedFile);
                                            }
                                        });
                                }
                            }
                        }}
                        text="Hochladen und einfügen"
                        color="blue"
                    />
                )}
            </div>
        </section>
    );
});

export default FileUpload;
