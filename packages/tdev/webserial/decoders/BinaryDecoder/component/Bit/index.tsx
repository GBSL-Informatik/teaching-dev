import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import Decoder from '../../model/Decoder';

interface Props {
    decoder: Decoder;
    bitPos: number;
}

const Bit = observer((props: Props) => {
    const { decoder, bitPos } = props;
    const value = decoder.buffer[bitPos];
    return (
        <div
            className={clsx(
                styles.bit,
                value === '1' && styles.one,
                value === '0' && styles.zero,
                value === undefined && styles.unset
            )}
        ></div>
    );
});

export default Bit;
