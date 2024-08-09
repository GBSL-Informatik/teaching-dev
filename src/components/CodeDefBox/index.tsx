import React from 'react';
import clsx from 'clsx';

import styles from './styles.module.scss';

interface Props {
    children: React.JSX.Element | React.JSX.Element[];
}

const DefBox = (props: Props) => {
    return (
        <div
            className={clsx(styles.def, 'theme-admonition', 'theme-admonition-info', 'alert', 'alert--info')}
        >
            {props.children}
        </div>
    );
};

export default DefBox;
