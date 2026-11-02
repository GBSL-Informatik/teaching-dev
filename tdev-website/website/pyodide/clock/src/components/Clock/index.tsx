import Card from '@tdev-components/shared/Card';
import CopyBadge from '@tdev-components/shared/CopyBadge';
import { useExtensionStore } from '@tdev/pyodide-code/hooks/useExtensionStore';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import { useMemo } from 'react';
import clockExtension from '../../../client';
import Pointer from './Pointer';
import styles from './styles.module.scss';

interface ClockProps {
    clockId: string;
}

const CARD_CLASS_NAMES = { body: clsx(styles.clockCard), card: clsx(styles.card) };
const CLOCK_TICKS = Array.from({ length: 60 }, (_, index) => (
    <div
        key={index}
        className={clsx(styles.tick, index % 5 === 0 && styles.hourTick)}
        style={{ transform: `rotate(${index * 6}deg)` }}
    />
));

const Clock = observer(({ clockId }: ClockProps) => {
    const clockStore = useExtensionStore(clockExtension);
    const clock = clockStore.useClock(clockId);
    const header = useMemo(
        () => (
            <h3>
                Uhr: <CopyBadge value={clockId} className={clsx(styles.id)} />
            </h3>
        ),
        [clockId]
    );
    return (
        <Card classNames={CARD_CLASS_NAMES} header={header}>
            <div className={clsx(styles.dial)}>
                {CLOCK_TICKS}
                <Pointer clock={clock} type="hours" />
                <Pointer clock={clock} type="minutes" />
                <Pointer clock={clock} type="seconds" />
            </div>
        </Card>
    );
});

export default Clock;
