import React from 'react';
import clsx from 'clsx';
import styles from '../styles.module.scss';

const Options = ({ children }: { children: React.ReactNode }) => {
    return (
        <div className={clsx(styles.optionsBlock)}>
            <div className={styles.optionsContainer}>{children}</div>
        </div>
    );
};

export default Options;
