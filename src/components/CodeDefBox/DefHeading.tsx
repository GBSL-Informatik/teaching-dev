import React from 'react';
import clsx from 'clsx';

import styles from './styles.module.scss';
import Icon from '@mdi/react';
import { mdiFileEyeOutline } from '@mdi/js';

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
