import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';

interface Props {
    value: '0' | '1' | '';
}

const Bit = observer((props: Props) => {
    const { value } = props;
    return (
        <div
            className={clsx(
                styles.bit,
                value === '1' && styles.one,
                value === '0' && styles.zero,
                value === '' && styles.unset
            )}
        ></div>
    );
});

export default Bit;
