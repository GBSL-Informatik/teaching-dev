import React from 'react';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import styles from './styles.module.scss';
import Card from '@tdev-components/shared/Card';
interface Props {
    src: string;
    fileName?: string;
    actions?: React.ReactElement;
    maxWidth?: string | number;
    maxHeight?: string | number;
    muted?: boolean;
    controls?: boolean;
}
const AudioPreview = observer((props: Props) => {
    const ref = React.useRef<HTMLVideoElement>(null);
    return (
        <div
            className={clsx(styles.preview)}
            style={{ maxWidth: props.maxWidth, maxHeight: props.maxHeight }}
        >
            <Card
                classNames={{ card: styles.previewCard, image: styles.audioContainer, header: styles.header }}
                header={props.fileName}
            >
                <audio
                    autoPlay
                    muted={props.muted}
                    className={clsx(styles.audio)}
                    ref={ref}
                    controls={props.controls}
                >
                    <source src={props.src} />
                </audio>
            </Card>
        </div>
    );
});
export default AudioPreview;
