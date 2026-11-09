import { mdiCloudArrowUpOutline } from '@mdi/js';
import Icon from '@mdi/react';
import Button from '@tdev-components/shared/Button';
import Checkbox from '@tdev-components/shared/Checkbox';
import TextInput from '@tdev-components/shared/TextInput';
import { resolvePath } from '@tdev-models/helpers/resolvePath';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import React, { useId, useState } from 'react';
import { useCmsStore } from '../../hooks/useCmsStore';
import BinFile from '../../models/BinFile';
import { default as CmsFile } from '../../models/File';
import { sanitizeFileName } from '../../models/helpers';
import ImagePreview from '../Github/iFile/File/FilePreview/ImagePreview';
import styles from './styles.module.scss';

const toMb = (bytes: number): number => {
    return Math.round((100 * bytes) / 1024 / 1024) / 100;
};
interface Props {
    onFilesUploaded: (files: CmsFile | BinFile) => void;
    onDiscard?: () => void;
    onFileSelected?: () => void;
    accept: string;
    className?: string;
    description?: string;
    uploadDir: string;
    branch: string;
    uploadButtonLabel: string;
    /** files to upload, e.g. dropped into the editor */
    initialFiles?: File[];
}

const FileUpload = observer((props: Props) => {
    const [files, setFiles] = useState<File[]>(props.initialFiles ?? []);
    const [isDragOver, setIsDragOver] = useState(false);
    const labelRef = React.useRef<HTMLLabelElement>(null);
    const cmsStore = useCmsStore();
    const [uploadName, setUploadName] = React.useState(() =>
        props.initialFiles?.[0] ? sanitizeFileName(props.initialFiles[0].name) : ''
    );
    const [compress, setCompress] = React.useState(true);

    const inputId = useId();
    const labelId = useId();

    const handleFileChange: React.ChangeEventHandler<HTMLInputElement> = (event) => {
        const selectedFiles = event.target.files;
        if (selectedFiles && selectedFiles.length > 0) {
            const newFiles = Array.from(selectedFiles);
            setUploadName(sanitizeFileName(newFiles[0].name));
            setFiles(newFiles);
            props.onFileSelected?.();
        }
    };

    const handleDrop: React.DragEventHandler<HTMLDivElement> = (event) => {
        event.preventDefault();
        setIsDragOver(false);
        const droppedFiles = event.dataTransfer.files;
        if (droppedFiles.length > 0) {
            const newFiles = Array.from(droppedFiles);
            setUploadName(sanitizeFileName(newFiles[0].name));
            setFiles(newFiles);
            props.onFileSelected?.();
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
                            <p>Max. Dateigrösse: 100 MB</p>
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
                    <div className={clsx(styles.actions)}>
                        <Button
                            onClick={() => {
                                setFiles([]);
                                setUploadName('');
                                props.onDiscard?.();
                            }}
                            text={'Verwerfen'}
                            color="black"
                        />
                        <Button
                            onClick={() => {
                                if (files[0].type.startsWith('image/')) {
                                    const imgDir = props.uploadDir;
                                    const fName = sanitizeFileName(uploadName);
                                    // svgs are not compressed, the checkbox is not shown for them
                                    if (compress && files[0].type !== 'image/svg+xml') {
                                        cmsStore
                                            .uploadImage(
                                                files[0],
                                                resolvePath(imgDir, fName),
                                                props.branch,
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
                                                    resolvePath(imgDir, fName),
                                                    new Uint8Array(content),
                                                    props.branch,
                                                    undefined,
                                                    `Upload ${fName}`
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
                            text={props.uploadButtonLabel}
                            color="blue"
                        />
                    </div>
                )}
            </div>
        </section>
    );
});

export default FileUpload;
