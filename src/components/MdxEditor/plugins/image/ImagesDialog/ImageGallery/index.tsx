import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import { useStore } from '@tdev-hooks/useStore';
import ImagePreview from '@tdev-components/Github/iFile/File/ImagePreview';
import Loader from '@tdev-components/Loader';
import File from '@tdev-models/cms/File';
import { IMAGE_DIR_NAME } from '@tdev-models/cms/Dir';

interface Props {
    onSelect: (src: string) => void;
}

const ImageGallery = observer((props: Props) => {
    const cmsStore = useStore('cmsStore');
    const { activeEntry } = cmsStore;
    if (!activeEntry) {
        return null;
    }
    return (
        <div className={clsx(styles.imageGallery)}>
            {activeEntry.parent?.images.map((image) => {
                if (image.type === 'file') {
                    return (
                        <div onClick={() => props.onSelect(`./${image.name}`)} className={clsx(styles.image)}>
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
                            onClick={() => props.onSelect(`./${image.parent.name}/${image.name}`)}
                            className={clsx(styles.image)}
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
    );
});

export default ImageGallery;
