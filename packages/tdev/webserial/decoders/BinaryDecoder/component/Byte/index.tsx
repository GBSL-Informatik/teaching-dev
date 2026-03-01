import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import Decoder from '../../model/Decoder';
import Bit from '../Bit';

interface Props {
    decoder: Decoder;
    offset: number;
}

const BYTE_POS = [0, 1, 2, 3, 4, 5, 6, 7];

const Byte = observer((props: Props) => {
    const { decoder, offset } = props;
    if (offset >= decoder.size) {
        return null;
    }
    console.log('rerender byte', offset);
    return (
        <div className={clsx(styles.byte)}>
            <div className={clsx(styles.bits)}>
                {BYTE_POS.map((pos) => (
                    <Bit key={pos} decoder={decoder} bitPos={offset * 8 + pos} />
                ))}
            </div>
            <div className={clsx(styles.decoded)}>
                <div className={clsx(styles.hex)}>{decoder.getHex(offset)}</div>
                <div className={clsx(styles.dec)}>{decoder.getDec(offset)}</div>
            </div>
        </div>
    );
});

export default Byte;
