import * as React from 'react';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';

interface Props {
    children?: React.ReactNode;
}

const Container = observer((props: Props) => {
    return <div className={styles.footer}>{props.children}</div>;
});

export default Container;
