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
import File from '@tdev-models/cms/File';

export const ImageDialog = observer(() => {
    const [src, setSrc] = React.useState('');
    const [file, setFile] = React.useState<File | null>(null);
    const insertImage = usePublisher(insertImage$);

    return (
        <Card
            header={<h4>Bild Einfügen</h4>}
            classNames={{ card: styles.imageDialog }}
            footer={
                <div>
                    <Button
                        onClick={() => {
                            insertImage({ src: src });
                        }}
                        text="Einfügen"
                        disabled={!src}
                        color="green"
                    />
                </div>
            }
        >
            <ImageGallery
                onSelect={(src, file) => {
                    setSrc(src);
                    setFile(file);
                }}
            />
            <TextInput
                label="Bild URL"
                type="url"
                onChange={(src) => {
                    setSrc(src);
                    if (file) {
                        setFile(null);
                    }
                }}
            />
            {src && <ImagePreview src={file ? File.ImageDataUrl(file) : src} />}
        </Card>
    );
});
