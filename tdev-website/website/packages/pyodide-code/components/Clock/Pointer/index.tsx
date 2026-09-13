import { Clock } from '@tdev/packages/pyodide-code/models/Clock';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import styles from '../styles.module.scss';

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
