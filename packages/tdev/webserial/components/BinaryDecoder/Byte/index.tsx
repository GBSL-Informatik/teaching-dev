import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import Decoder from '../model/Decoder';
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
    return (
        <div className={clsx(styles.byte)}>
            {BYTE_POS.map((pos) => (
                <Bit key={pos} decoder={decoder} bitPos={offset * 8 + pos} />
            ))}
        </div>
    );
});

export default Byte;
