/**
 * By Mdx Editor, @url https://github.com/mdx-editor/editor/tree/main/src/plugins/image
 */

import React from 'react';
// import styles from '../../styles/ui.module.css';
import Card from '@tdev-components/shared/Card';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import ImageGallery from './ImageGallery';
import { usePublisher } from '@mdxeditor/editor';
import { insertImage$ } from '..';
import TextInput from '@tdev-components/shared/TextInput';
import ImagePreview from '@tdev-components/Cms/Github/iFile/File/ImagePreview';
import Button from '@tdev-components/shared/Button';
import { default as CmsFile } from '@tdev-models/cms/File';
import FileUpload from '@tdev-components/shared/FileUpload';
import { IMAGE_DIR_NAME } from '@tdev-models/cms/Dir';
import clsx from 'clsx';

interface Props {
    onClose: () => void;
}

export const ImageDialog = observer((props: Props) => {
    const [src, setSrc] = React.useState('');
    const [file, setFile] = React.useState<CmsFile | null>(null);
    const [cleanSrc, setCleanSrc] = React.useState(0);
    const insertImage = usePublisher(insertImage$);

    return (
        <Card
            header={<h4>Bild Einfügen</h4>}
            classNames={{
                card: styles.imageDialog,
                body: styles.body,
                image: styles.preview,
                footer: styles.footer
            }}
            footer={
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
                            insertImage({ src: src });
                            props.onClose();
                        }}
                        text="Einfügen"
                        disabled={!src}
                        color="green"
                    />
                </>
            }
            image={
                src ? (
                    <img
                        title="Ausgewähltes Bild"
                        className={clsx(styles.previewImage)}
                        src={file ? CmsFile.ImageDataUrl(file) : src}
                    />
                ) : null
            }
        >
            <ImageGallery
                onSelect={(src, file) => {
                    setSrc(src);
                    setFile(file);
                    setCleanSrc((prev) => prev + 1);
                }}
            />
            <TextInput
                label="Bild URL"
                type="url"
                key={cleanSrc}
                onChange={(src) => {
                    setSrc(src);
                    if (file) {
                        setFile(null);
                    }
                }}
            />
            <FileUpload
                onFilesUploaded={(file) => {
                    insertImage({ src: `./${IMAGE_DIR_NAME}/${file.name}` });
                    props.onClose();
                }}
                accept="image/*"
                description="Bilder per Drag&Drop hochladen"
            />
        </Card>
    );
});
