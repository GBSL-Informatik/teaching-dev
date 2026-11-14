import { observer } from 'mobx-react-lite';
import React from 'react';
import styles from './styles.module.scss';

interface Props {
    children: React.ReactNode;
}

const Steps = observer((props: Props) => {
    return <div className={styles.steps}>{props.children}</div>;
});

export default Steps;
