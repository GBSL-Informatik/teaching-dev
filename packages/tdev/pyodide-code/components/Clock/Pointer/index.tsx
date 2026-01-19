import clsx from 'clsx';
import styles from '../styles.module.scss';
import { observer } from 'mobx-react-lite';
import { Clock } from '@tdev/pyodide-code/models/Clock';

interface Props {
    clock: Clock;
    type: 'hours' | 'minutes' | 'seconds';
}

const Pointer = observer((props: Props) => {
    const { clock, type } = props;
    const angle = clock[type];
    return (
        <div
            className={clsx(styles.pointer, styles[type])}
            style={{
                transitionDuration: `${clock.transitionDurationMs}ms`,
                transform: `rotate(${angle}deg)`
            }}
        />
    );
});

export default Pointer;
