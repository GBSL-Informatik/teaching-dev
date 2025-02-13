import React from 'react';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import styles from './styles.module.scss';
import Card from '@tdev-components/shared/Card';
interface Props {
    src: string;
    fileName?: string;
}
const ImagePreview = observer((props: Props) => {
    return (
        <div className={clsx(styles.preview)}>
            <Card
                classNames={{ image: styles.img, header: styles.header }}
                image={<img src={props.src} />}
                header={props.fileName}
            ></Card>
        </div>
    );
});
export default ImagePreview;
