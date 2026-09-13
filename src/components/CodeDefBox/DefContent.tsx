import clsx from 'clsx';
import React from 'react';

import styles from './styles.module.scss';

interface Props {
    children: React.ReactNode | React.ReactNode[];
    className?: string;
}

const DefContent = (props: Props) => {
    return <div className={clsx(styles.content, props.className)}>{props.children}</div>;
};

export default DefContent;
