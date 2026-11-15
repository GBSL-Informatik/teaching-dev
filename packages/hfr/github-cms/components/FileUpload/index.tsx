import { mdiCloudArrowUpOutline } from '@mdi/js';
import Icon from '@mdi/react';
import Alert from '@tdev-components/shared/Alert';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import React, { useId, useState } from 'react';
import BinFile from '../../models/BinFile';
import { default as CmsFile } from '../../models/File';
import SelectedFile from './SelectedFile';
import { MAX_FILE_SIZE_MB, type Selection, selectFile } from './selectFile';
import styles from './styles.module.scss';

interface Props {
    onFileUploaded: (file: CmsFile | BinFile) => void;
    onDiscard?: () => void;
    onFileSelected?: () => void;
    /** the allowed file types, like the `accept` attribute of `<input type="file">`, e.g. `image/*` */
    accept?: string;
    className?: string;
    description?: string;
    uploadDir: string;
    branch: string;
    uploadButtonLabel: string;
    /** files to upload, e.g. dropped into the editor */
    initialFiles?: File[];
}

const FileUpload = observer((props: Props) => {
    const [selection, setSelection] = useState<Selection>(() =>
        props.initialFiles ? selectFile(props.initialFiles, props.accept) : {}
    );
    const [isDragOver, setIsDragOver] = useState(false);
    const labelRef = React.useRef<HTMLLabelElement>(null);
    const inputId = useId();
    const { file } = selection;

    const handleFiles = (files: File[]) => {
        const newSelection = selectFile(files, props.accept);
        setSelection(newSelection);
        if (newSelection.file) {
            props.onFileSelected?.();
        }
    };

    const handleDiscard = () => {
        setSelection({});
        props.onDiscard?.();
    };

    const handleDrop: React.DragEventHandler<HTMLDivElement> = (event) => {
        event.preventDefault();
        setIsDragOver(false);
        handleFiles(Array.from(event.dataTransfer.files));
    };

    return (
        <section className={clsx(styles.dragDrop, props.className)}>
            <div
                className={clsx(
                    styles.documentUploader,
                    styles.uploadBox,
                    file && styles.active,
                    isDragOver && styles.dragover
                )}
                onDrop={handleDrop}
                onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onClick={(e) => {
                    if (!file && labelRef.current && e.target !== labelRef.current) {
                        labelRef.current.click();
                    }
                }}
            >
                <div className={clsx(styles.uploadInfo)}>
                    <Icon path={mdiCloudArrowUpOutline} size={1} color="var(--ifm-color-primary)" />
                    <div className={clsx(styles.info)}>
                        <p>{props.description || 'Datei per Drag&Drop hochladen'}</p>
                        <p>Max. Dateigrösse: {MAX_FILE_SIZE_MB} MB</p>
                    </div>
                </div>
                <input
                    type="file"
                    hidden
                    id={inputId}
                    onChange={(e) => handleFiles(Array.from(e.target.files ?? []))}
                    accept={props.accept}
                />
                <label
                    htmlFor={inputId}
                    className={clsx('button button--primary', styles.browseBtn)}
                    ref={labelRef}
                >
                    Durchsuchen
                </label>
                {file && (
                    <div className={clsx(styles.selectedFile)}>
                        <SelectedFile
                            key={`${file.name}-${file.size}-${file.lastModified}`}
                            file={file}
                            uploadDir={props.uploadDir}
                            branch={props.branch}
                            uploadButtonLabel={props.uploadButtonLabel}
                            onDiscard={handleDiscard}
                            onUploaded={props.onFileUploaded}
                        />
                    </div>
                )}
            </div>
            {selection.error && (
                <Alert type="danger" onDiscard={() => setSelection({})}>
                    {selection.error}
                </Alert>
            )}
        </section>
    );
});

export default FileUpload;
