import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import { useStore } from '@tdev-hooks/useStore';
import Decoder from '../model/Decoder';

interface Props {
    decoder: Decoder;
    bitPos: number;
}

const Bit = observer((props: Props) => {
    const { decoder, bitPos } = props;
    const value = decoder.buffer.length < bitPos ? undefined : decoder.buffer[bitPos] === '1' ? 1 : 0;
    return <div className={clsx(styles.bit, value === 1 ? styles.active : styles.inactive)}></div>;
});

export default Bit;
