import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import type { Clock } from '../../../models/Clock';
import styles from '../styles.module.scss';

interface PointerProps {
    clock: Clock;
    type: 'hours' | 'minutes' | 'seconds';
}

const Pointer = observer(({ clock, type }: PointerProps) => {
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
