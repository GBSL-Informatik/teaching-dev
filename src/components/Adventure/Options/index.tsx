import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';

interface Props {
    children: React.ReactNode;
}

const Options = observer((props: Props) => {
    return <div className={clsx(styles.options)}>{props.children}</div>;
});

export default Options;
