import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import { useStore } from '@tdev-hooks/useStore';
import { useDeviceId } from '@tdev/webserial/hooks/useDeviceId';
import Decoder from '../model/Decoder';
import Icon from '@mdi/react';
import { mdiCircleSmall, mdiLoading } from '@mdi/js';
import Byte from './Byte';

interface Props {
    bitDimension?: { width: string; height: string };
}

const BinaryDecoder = observer((props: Props) => {
    const subscriptionId = React.useId();
    const viewStore = useStore('viewStore');
    const webserialStore = viewStore.useStore('webserialStore');
    const deviceId = useDeviceId();
    const device = webserialStore.devices.get(deviceId);
    const decoder = React.useMemo(() => {
        if (device) {
            return new Decoder(subscriptionId, device);
        }
    }, [device, subscriptionId]);
    React.useEffect(() => {
        if (decoder) {
            let i = 0;
            const bits = [
                '0',
                '1',
                '0',
                '0',
                '0',
                '0',
                '0',
                '1',
                '0',
                '1',
                '1',
                '0',
                '0',
                '0',
                '1',
                '0',
                '0',
                '1',
                '0',
                '0',
                '0',
                '0',
                '1',
                '0',
                '0',
                '1',
                '0',
                '0'
            ];
            const interval = setInterval(() => {
                if (i < bits.length) {
                    decoder.onNewLines([bits[i]]);
                    i++;
                } else {
                    clearInterval(interval);
                }
            }, 500);
            return () => {
                clearInterval(interval);
                decoder?.cleanup();
            };
        }
    }, [decoder, subscriptionId]);

    if (!decoder) {
        return null;
    }

    return (
        <div
            className={clsx(styles.binaryDecoder)}
            style={
                {
                    '--tdev-bit-width': `${props.bitDimension?.width ?? '5px'}`,
                    '--tdev-bit-height': `${props.bitDimension?.height ?? '15px'}`
                } as React.CSSProperties
            }
        >
            <Icon
                path={decoder.isProcessing ? mdiLoading : mdiCircleSmall}
                size={0.75}
                spin={decoder.isProcessing}
                className={clsx(styles.indicator)}
            />
            <div className={clsx(styles.bytes)}>
                {[...Array(decoder.size)].map((_, i) => (
                    <Byte key={i} decoder={decoder} offset={i} />
                ))}
            </div>
            {decoder.lines.map((line, i) => (
                <div key={i}>{line}</div>
            ))}
        </div>
    );
});

export default BinaryDecoder;
