import React from 'react';
import clsx from 'clsx';

import styles from './styles.module.scss';

interface Props {
    children: React.ReactNode | React.ReactNode[];
}

const DefContent = (props: Props) => {
    return <div className={clsx(styles.content)}>{props.children}</div>;
};

export default DefContent;
