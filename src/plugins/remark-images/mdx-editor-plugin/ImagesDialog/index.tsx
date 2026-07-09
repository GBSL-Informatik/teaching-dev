import React from 'react';
import Card from '@tdev-components/shared/Card';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import { usePublisher } from '@mdxeditor/editor';
import { insertImage$ } from '..';
import TextInput from '@tdev-components/shared/TextInput';
import Button from '@tdev-components/shared/Button';
import FileUpload from '@tdev-components/shared/FileUpload';
import clsx from 'clsx';
import { Asset } from '@tdev/github-cms/models/Dir';
import BinFile from '@tdev/github-cms/models/BinFile';
import AssetSelector from '@tdev/github-cms/components/MdxEditor/AssetSelector';
import { useCmsStore } from '@tdev/github-cms/hooks/useCmsStore';

interface Props {
    onClose: () => void;
    /**
     * the current image src - in this case, the image to be updated
     */
    src?: string;
    /**
     * the current image src - in this case, the image to be updated
     */
    binFile?: BinFile;
    onSelect?: (src: string) => void;
    className?: string;
}

export const ImageDialog = observer((props: Props) => {
    const cmsStore = useCmsStore();
    const [src, setSrc] = React.useState(props.src || '');
    const [file, setFile] = React.useState<BinFile | null>(props.binFile || null);
    const [isUploading, setIsUploading] = React.useState(false);
    const [cleanSrc, setCleanSrc] = React.useState(0);
    const insertImage = usePublisher(insertImage$);
    const { activeEntry } = cmsStore;
    if (!activeEntry) {
        return null;
    }
    const isUpdatingSrc = props.src || props.binFile;

    return (
        <Card
            header={<h4>Bild Einfügen</h4>}
            classNames={{
                card: clsx(styles.imageDialog, props.className),
                body: styles.body,
                image: styles.preview,
                footer: styles.footer
            }}
            footer={
                !isUploading && (
                    <>
                        <Button onClick={props.onClose} text="Abbrechen" />
                        <Button
                            color="orange"
                            disabled={!src}
                            onClick={() => {
                                setSrc('');
                                setFile(null);
                                setCleanSrc((prev) => prev + 1);
                            }}
                            text="Entfernen"
                        />
                        <Button
                            onClick={() => {
                                if (props.onSelect) {
                                    props.onSelect(src);
                                } else {
                                    insertImage({ src: src });
                                }
                                props.onClose();
                            }}
                            text={isUpdatingSrc ? 'Aktualisieren' : 'Einfügen'}
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
                onFilesUploaded={(file) => {
                    insertImage({ src: `./${Asset.IMAGE}/${file.name}` });
                    props.onClose();
                }}
                accept="image/*"
                description="Bilder per Drag&Drop hochladen"
                onFileSelected={() => setIsUploading(true)}
                onDiscard={() => setIsUploading(false)}
                className={clsx(styles.fileUpload)}
                uploadButtonLabel={isUpdatingSrc ? 'Hochladen und aktualisieren' : 'Hochladen und einfügen'}
                uploadDir={activeEntry.parent.imageDirPath}
                branch={activeEntry.branch}
            />
            {!isUploading && (
                <>
                    <TextInput
                        label="Bild URL"
                        type="url"
                        key={cleanSrc}
                        className={clsx(styles.srcInput)}
                        value={src}
                        onChange={(src) => {
                            setSrc(src);
                            if (file) {
                                setFile(null);
                            }
                        }}
                    />
                    <AssetSelector
                        header="Vorhandene Bilder"
                        className={clsx(styles.assetSelector)}
                        onSelect={(selected) => {
                            const src = activeEntry.relativePath(selected);
                            setSrc(src);
                            setFile(selected as BinFile);
                            setCleanSrc((prev) => prev + 1);
                        }}
                        filter={(entry): entry is BinFile => {
                            return entry.isImage;
                        }}
                    />
                </>
            )}
        </Card>
    );
});
