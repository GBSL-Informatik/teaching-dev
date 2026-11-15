import { mdiCloudUploadOutline, mdiLoading } from '@mdi/js';
import Alert from '@tdev-components/shared/Alert';
import Button from '@tdev-components/shared/Button';
import Checkbox from '@tdev-components/shared/Checkbox';
import TextInput from '@tdev-components/shared/TextInput';
import { resolvePath } from '@tdev-models/helpers/resolvePath';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import React from 'react';
import { useCmsStore } from '../../hooks/useCmsStore';
import BinFile from '../../models/BinFile';
import { default as CmsFile } from '../../models/File';
import { isCompressibleImage, sanitizeFileName } from '../../models/helpers';
import ImagePreview from '../Github/iFile/File/FilePreview/ImagePreview';
import styles from './styles.module.scss';
import { usePreviewUrl } from './usePreviewUrl';

const toMb = (bytes: number): number => {
    return Math.round((100 * bytes) / 1024 / 1024) / 100;
};

interface Props {
    file: File;
    uploadDir: string;
    branch: string;
    uploadButtonLabel: string;
    onDiscard: () => void;
    onUploaded: (file: CmsFile | BinFile) => void;
}

/**
 * Asks for the name of the selected file and uploads it.
 */
const SelectedFile = observer((props: Props) => {
    const { file, branch } = props;
    const cmsStore = useCmsStore();
    const [name, setName] = React.useState(() => sanitizeFileName(file.name));
    const [compress, setCompress] = React.useState(true);
    const [isUploading, setIsUploading] = React.useState(false);
    const [error, setError] = React.useState('');
    const previewUrl = usePreviewUrl(file);

    const path = resolvePath(props.uploadDir, sanitizeFileName(name));
    const isPathTaken = !!cmsStore.findEntry(branch, path);

    const handleUpload = () => {
        setIsUploading(true);
        setError('');
        cmsStore
            .uploadFile(file, path, branch, compress)
            .then((uploaded) => {
                if (uploaded && uploaded.type !== 'file_stub') {
                    props.onUploaded(uploaded);
                }
            })
            .catch((e: Error) => setError(e.message))
            .finally(() => setIsUploading(false));
    };

    return (
        <>
            <div className={clsx(styles.fileInfo)}>
                {previewUrl ? (
                    <ImagePreview src={previewUrl} fileName={file.name} />
                ) : (
                    <span>{file.name}</span>
                )}
                <span>{toMb(file.size)} MB</span>
                {isCompressibleImage(file) && (
                    <Checkbox checked={compress} onChange={setCompress} label="Komprimieren auf < 1MB" />
                )}
            </div>
            <TextInput label="Dateiname" type="text" onChange={setName} value={name} />
            <small>
                Wird gespeichert als <code>{path}</code>
            </small>
            {isPathTaken && (
                <Alert type="warning">Diese Datei existiert bereits. Bitte einen anderen Namen wählen.</Alert>
            )}
            {error && (
                <Alert type="danger" onDiscard={() => setError('')}>
                    {error}
                </Alert>
            )}
            <div className={clsx(styles.actions)}>
                <Button onClick={props.onDiscard} text="Verwerfen" color="black" disabled={isUploading} />
                <Button
                    onClick={handleUpload}
                    text={props.uploadButtonLabel}
                    color="blue"
                    disabled={!name || isPathTaken || isUploading}
                    icon={isUploading ? mdiLoading : mdiCloudUploadOutline}
                    spin={isUploading}
                />
            </div>
        </>
    );
});

export default SelectedFile;
