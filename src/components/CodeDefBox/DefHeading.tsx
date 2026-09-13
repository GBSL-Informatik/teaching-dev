import clsx from 'clsx';
import React from 'react';

import { mdiFileEyeOutline } from '@mdi/js';
import Icon from '@mdi/react';
import styles from './styles.module.scss';

interface Props {
    children: React.ReactNode | React.ReactNode[];
    className?: string;
}

const DefHeading = (props: Props) => {
    return (
        <div className={clsx(styles.heading, props.className)}>
            <Icon path={mdiFileEyeOutline} size={1} />
            {props.children}
        </div>
    );
};

export default DefHeading;
