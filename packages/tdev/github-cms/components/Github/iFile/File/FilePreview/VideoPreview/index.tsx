import React from 'react';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import styles from './styles.module.scss';
import Card from '@tdev-components/shared/Card';
import type { Property } from 'csstype';
interface Props {
    src: string;
    fileName?: string;
    actions?: React.ReactElement;
    maxWidth?: string | number;
    maxHeight?: string | number;
    playbackRate?: number;
    muted?: boolean;
    controls?: boolean;
}
const VideoPreview = observer((props: Props) => {
    const ref = React.useRef<HTMLVideoElement>(null);
    React.useEffect(() => {
        if (ref.current && props.playbackRate) {
            ref.current.playbackRate = props.playbackRate;
        }
    }, [ref, props.playbackRate]);
    return (
        <div
            className={clsx(styles.preview)}
            style={{ maxWidth: props.maxWidth, maxHeight: props.maxHeight }}
        >
            <Card
                classNames={{ card: styles.previewCard, image: styles.videoContainer, header: styles.header }}
                image={
                    <video
                        autoPlay
                        muted={props.muted}
                        loop
                        className={clsx(styles.video)}
                        ref={ref}
                        controls={props.controls}
                    >
                        <source src={props.src} />
                    </video>
                }
                header={props.fileName}
            ></Card>
        </div>
    );
});
export default VideoPreview;
