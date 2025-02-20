import React from 'react';
import clsx from 'clsx';

import styles from './styles.module.scss';

interface Props {
    children: React.ReactNode | React.ReactNode[];
    className?: string;
}

const DefBox = (props: Props) => {
    return (
        <div
            className={clsx(
                styles.def,
                props.className,
                'theme-admonition',
                'theme-admonition-info',
                'alert',
                'alert--info'
            )}
        >
            {props.children}
        </div>
    );
};

export default DefBox;
