import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import Bit from '../Bit';

interface Props {
    byteString: string;
}

const BYTE_POS = [0, 1, 2, 3, 4, 5, 6, 7] as const;
const NEWLINE_BYTE = '00001010' as const;

const Byte = observer((props: Props) => {
    const { byteString } = props;
    const hex =
        byteString.length >= 8
            ? parseInt(byteString, 2).toString(16).toUpperCase().padStart(2, '0')
            : undefined;
    const dec = byteString.length >= 8 ? parseInt(byteString, 2) : undefined;
    return (
        <>
            <div className={clsx(styles.byte)}>
                <div className={clsx(styles.bits)}>
                    {BYTE_POS.map((pos) => (
                        <Bit key={pos} value={byteString.charAt(pos) as '0' | '1' | ''} />
                    ))}
                </div>
                {byteString.length >= 8 && (
                    <div className={clsx(styles.decoded)}>
                        <div className={clsx(styles.hex)}>{hex}</div>
                        <div className={clsx(styles.dec)}>{dec}</div>
                    </div>
                )}
            </div>
            {byteString === NEWLINE_BYTE && <div className={clsx(styles.lineBreak)}></div>}
        </>
    );
});

export default Byte;
