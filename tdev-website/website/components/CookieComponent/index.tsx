import { useStore } from '@tdev-hooks/useStore';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import styles from './styles.module.scss';

interface CookieComponentProps {
    cookieId: string;
    className?: string;
}

const CHOCOLATE_CHIPS = [
    [65, 55],
    [125, 48],
    [148, 94],
    [109, 106],
    [57, 117],
    [84, 151],
    [139, 143]
];

const CookieComponent = observer(({ cookieId, className }: CookieComponentProps) => {
    const siteStore = useStore('siteStore');
    const cookie = siteStore.cookieStore.useCookie(cookieId);

    return (
        <div className={clsx(styles.container, className)}>
            <button
                type="button"
                className={clsx(styles.cookie)}
                aria-label={`Cookie ${cookieId} anklicken`}
                disabled={!cookie.isConnected}
                onClick={cookie.handleClick}
            >
                <svg viewBox="0 0 200 200" aria-hidden="true" className={clsx(styles.image)}>
                    <g transform={cookie.rotationTransform}>
                        <circle cx="100" cy="100" r="88" className={clsx(styles.dough)} />
                        {CHOCOLATE_CHIPS.map(([x, y]) => (
                            <circle key={`${x}-${y}`} cx={x} cy={y} r="10" className={clsx(styles.chip)} />
                        ))}
                    </g>
                </svg>
            </button>
            <span className={clsx(styles.label)}>{cookieId}</span>
            <span role="status" className={clsx(styles.status)}>
                {cookie.isConnected ? 'Klicke auf den Cookie.' : 'Starte zuerst das Python-Programm.'}
            </span>
        </div>
    );
});

export default CookieComponent;
