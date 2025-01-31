/**
 * By Mdx Editor, @url https://github.com/mdx-editor/editor/tree/main/src/plugins/image
 */

import React from 'react';
// import styles from '../../styles/ui.module.css';
import Card from '@tdev-components/shared/Card';
import { useStore } from '@tdev-hooks/useStore';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import ImageGallery from './ImageGallery';
import { usePublisher } from '@mdxeditor/editor';
import { insertImage$, saveImage$ } from '..';
import TextInput from '@tdev-components/shared/TextInput';
import ImagePreview from '@tdev-components/Github/iFile/File/ImagePreview';
import Button from '@tdev-components/shared/Button';

export const ImageDialog = observer(() => {
    const cmsStore = useStore('cmsStore');
    const [src, setSrc] = React.useState('');
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
                onSelect={(src) => {
                    setSrc(src);
                }}
            />
            <TextInput
                label="Bild URL"
                type="url"
                onChange={(src) => {
                    setSrc(src);
                }}
            />
            {src && <ImagePreview src={src} />}
        </Card>
    );
});
