import Button from '@tdev-components/shared/Button';
import Card from '@tdev-components/shared/Card';
import TextInput from '@tdev-components/shared/TextInput';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import React from 'react';
import FileUpload from '../../../components/FileUpload';
import AssetSelector from '../../../components/MdxEditor/AssetSelector';
import { useCmsStore } from '../../../hooks/useCmsStore';
import BinFile from '../../../models/BinFile';
import { Asset } from '../../../models/Dir';
import styles from './styles.module.scss';

interface Props {
    onClose: () => void;
    onSelect: (src: string) => void;
    /** the src of the image to update, if any */
    src?: string;
}

/**
 * Selects an image: either by uploading a new one, selecting an existing one or by url.
 */
const ImageDialog = observer((props: Props) => {
    const cmsStore = useCmsStore();
    const [src, setSrc] = React.useState(props.src || '');
    const [file, setFile] = React.useState<BinFile | null>(null);
    const [isUploading, setIsUploading] = React.useState(false);
    const [inputKey, setInputKey] = React.useState(0);
    const { activeEntry } = cmsStore;
    if (!activeEntry) {
        return null;
    }
    const isUpdate = !!props.src;

    const handleSelect = (src: string) => {
        props.onSelect(src);
        props.onClose();
    };

    return (
        <Card
            header={<h4>{isUpdate ? 'Bild ändern' : 'Bild einfügen'}</h4>}
            classNames={{
                card: clsx(styles.imageDialog),
                body: styles.body,
                image: styles.preview,
                footer: styles.footer
            }}
            footer={
                !isUploading && (
                    <>
                        <Button onClick={props.onClose} text="Abbrechen" />
                        <Button
                            onClick={() => handleSelect(src)}
                            text={isUpdate ? 'Aktualisieren' : 'Einfügen'}
                            disabled={!src}
                            color="green"
                        />
                    </>
                )
            }
            image={
                src && !isUploading ? (
                    <img
                        title="Ausgewähltes Bild"
                        className={clsx(styles.previewImage)}
                        src={file ? file.src : src}
                    />
                ) : null
            }
        >
            <FileUpload
                onFilesUploaded={(uploaded) => handleSelect(`./${Asset.IMAGE}/${uploaded.name}`)}
                accept="image/*"
                description="Bilder per Drag&Drop hochladen"
                onFileSelected={() => setIsUploading(true)}
                onDiscard={() => setIsUploading(false)}
                className={clsx(styles.fileUpload)}
                uploadButtonLabel={isUpdate ? 'Hochladen und aktualisieren' : 'Hochladen und einfügen'}
                uploadDir={activeEntry.parent.imageDirPath}
                branch={activeEntry.branch}
            />
            {!isUploading && (
                <>
                    <TextInput
                        label="Bild URL"
                        type="url"
                        key={inputKey}
                        className={clsx(styles.srcInput)}
                        value={src}
                        onChange={(src) => {
                            setSrc(src);
                            setFile(null);
                        }}
                    />
                    <AssetSelector
                        header="Vorhandene Bilder"
                        className={clsx(styles.assetSelector)}
                        onSelect={(selected) => {
                            setSrc(activeEntry.relativePath(selected));
                            setFile(selected as BinFile);
                            setInputKey((key) => key + 1);
                        }}
                        filter={(entry): entry is BinFile => entry.isImage}
                    />
                </>
            )}
        </Card>
    );
});

export default ImageDialog;
