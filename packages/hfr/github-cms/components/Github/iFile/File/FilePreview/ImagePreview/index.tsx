import Card from '@tdev-components/shared/Card';
import clsx from 'clsx';
import type { Property } from 'csstype';
import { observer } from 'mobx-react-lite';
import React from 'react';
import styles from './styles.module.scss';
interface Props {
    src: string;
    fileName?: string;
    actions?: React.ReactElement;
    maxWidth?: Property.MaxWidth<string | number>;
    maxHeight?: Property.MaxWidth<string | number>;
}
const ImagePreview = observer((props: Props) => {
    return (
        <div
            className={clsx(styles.preview)}
            style={{ maxWidth: props.maxWidth, maxHeight: props.maxHeight }}
        >
            <Card
                classNames={{ card: styles.previewCard, image: styles.img, header: styles.header }}
                image={<img src={props.src} />}
                header={props.fileName}
            ></Card>
        </div>
    );
});
export default ImagePreview;
