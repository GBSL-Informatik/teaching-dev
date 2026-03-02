import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import byteStyles from './Byte/styles.module.scss';
import { observer } from 'mobx-react-lite';
import { useStore } from '@tdev-hooks/useStore';
import { useDeviceId } from '@tdev/webserial/hooks/useDeviceId';
import Decoder from '../model/Decoder';
import Byte from './Byte';
import Card from '@tdev-components/shared/Card';
import { useFullscreenTargetId } from '@tdev-hooks/useFullscreenTargetId';

interface Props {
    bitDimension?: { width: string; height: string };
    demoData?: string;
}

const BinaryDecoder = observer((props: Props) => {
    const subscriptionId = React.useId();
    const viewStore = useStore('viewStore');
    const webserialStore = viewStore.useStore('webserialStore');
    const deviceId = useDeviceId();
    const fullscreenTargetId = useFullscreenTargetId();
    const device = webserialStore.devices.get(deviceId);
    const isFullscreen = viewStore.isFullscreenTarget(fullscreenTargetId);
    const decoder = React.useMemo(() => {
        if (device) {
            return new Decoder(subscriptionId, device);
        }
    }, [device, subscriptionId]);

    if (!(decoder && device && (device.isProcessing || decoder.bitSize > 0))) {
        return <div>Binärer Decoder</div>;
    }
    const bitSize = props.bitDimension ?? {
        width: '5px',
        height: '15px'
    };

    return (
        <div
            className={clsx(styles.binaryDecoder, isFullscreen && styles.fullscreen)}
            style={
                {
                    '--tdev-bit-width': bitSize.width,
                    '--tdev-bit-height': bitSize.height
                } as React.CSSProperties
            }
        >
            <div className={clsx(styles.meta)}>
                <div className={clsx(styles.bytes)}>
                    <div className={clsx(byteStyles.byte)}>
                        <div className={clsx(byteStyles.bits)}></div>
                        <div className={clsx(byteStyles.decoded)}>
                            <div className={clsx(byteStyles.hex)}>
                                <b>Hex</b>
                            </div>
                            <div className={clsx(byteStyles.dec)}>
                                <b>Dez</b>
                            </div>
                        </div>
                    </div>
                </div>
                <div className={clsx(styles.bytes)}>
                    {decoder.bytes.map((byte, i) => (
                        <Byte key={i} byteString={byte} />
                    ))}
                    {decoder.buffer.length > 0 && <Byte byteString={decoder.buffer.join('')} />}
                </div>
            </div>
            <Card classNames={{ card: clsx(styles.output) }}>
                {decoder.lines.map((line, i) => (
                    <div key={i}>{line}</div>
                ))}
            </Card>
        </div>
    );
});

export default BinaryDecoder;
