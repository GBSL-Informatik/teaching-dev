import Card from '@tdev-components/shared/Card';
import CopyBadge from '@tdev-components/shared/CopyBadge';
import { useStore } from '@tdev-hooks/useStore';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import Pointer from './Pointer';
import styles from './styles.module.scss';

interface Props {
    clockId: string;
}

const Clock = observer((props: Props) => {
    const { clockId } = props;
    const siteStore = useStore('siteStore');
    const clock = siteStore.clockStore.useClock(clockId);
    return (
        <Card
            classNames={{ body: clsx(styles.clockCard), card: clsx(styles.card) }}
            header={
                <h3>
                    Uhr: <CopyBadge value={clockId} className={clsx(styles.id)} />
                </h3>
            }
        >
            <div className={clsx(styles.dial)}>
                {[...Array(60).keys()].map((i) => (
                    <div
                        key={i}
                        className={clsx(styles.tick, i % 5 === 0 ? styles.hourTick : styles.minuteTick)}
                        style={{ transform: `rotate(${i * 6}deg)` }}
                    />
                ))}
                <Pointer clock={clock} type="hours" />
                <Pointer clock={clock} type="minutes" />
                <Pointer clock={clock} type="seconds" />
            </div>
        </Card>
    );
});

export default Clock;
