import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import byteStyles from './Byte/styles.module.scss';
import { observer } from 'mobx-react-lite';
import { useStore } from '@tdev-hooks/useStore';
import { useDeviceId } from '@tdev/webserial/hooks/useDeviceId';
import Decoder from '../model/Decoder';
import Icon from '@mdi/react';
import { mdiCircleSmall, mdiLoading } from '@mdi/js';
import Byte from './Byte';
import Card from '@tdev-components/shared/Card';
import { IfmColors } from '@tdev-components/shared/Colors';

interface Props {
    bitDimension?: { width: string; height: string };
    demoData?: string;
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
        if (decoder && props.demoData) {
            let i = 0;
            const bits = props.demoData.split('').filter((c) => c === '0' || c === '1');
            const interval = setInterval(() => {
                if (i < bits.length) {
                    device?.appendReceivedData(bits[i] + '\n');
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
    }, [decoder, subscriptionId, props.demoData]);

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
                {decoder.bytes.map((byte, i) => (
                    <Byte key={i} byteString={byte} />
                ))}
                {decoder.buffer.length > 0 && <Byte byteString={decoder.buffer.join('')} />}
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
