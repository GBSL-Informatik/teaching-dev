import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import { useStore } from '@tdev-hooks/useStore';
import ImagePreview from '@tdev-components/Cms/Github/iFile/File/ImagePreview';
import Loader from '@tdev-components/Loader';
import File from '@tdev-models/cms/File';
import { IMAGE_DIR_NAME } from '@tdev-models/cms/Dir';
import Card from '@tdev-components/shared/Card';

interface Props {
    onSelect: (src: string, entry: File) => void;
}

const ImageGallery = observer((props: Props) => {
    const cmsStore = useStore('cmsStore');
    const { activeEntry } = cmsStore;
    if (!activeEntry) {
        return null;
    }
    return (
        <Card
            classNames={{ card: styles.gallery, header: styles.header }}
            header={<h4>Verfügbare Bilder</h4>}
        >
            <div className={clsx(styles.imageGallery)}>
                {activeEntry.parent?.images.map((image) => {
                    if (image.type === 'file') {
                        return (
                            <div
                                onClick={() => props.onSelect(`./${image.name}`, image)}
                                className={clsx(styles.image)}
                                key={image.path}
                            >
                                <ImagePreview
                                    key={image.path}
                                    src={File.ImageDataUrl(image)}
                                    fileName={`./${image.name}`}
                                />
                            </div>
                        );
                    } else {
                        return <Loader key={image.path} label={image.name} />;
                    }
                })}
                {activeEntry.parent?.imageDir?.images.map((image) => {
                    if (image.type === 'file') {
                        return (
                            <div
                                onClick={() => props.onSelect(`./${image.parent.name}/${image.name}`, image)}
                                className={clsx(styles.image)}
                                key={image.path}
                            >
                                <ImagePreview
                                    key={image.path}
                                    src={File.ImageDataUrl(image)}
                                    fileName={`./${IMAGE_DIR_NAME}/${image.name}`}
                                />
                            </div>
                        );
                    } else {
                        return <Loader key={image.path} label={image.name} />;
                    }
                })}
            </div>
        </Card>
    );
});

export default ImageGallery;
