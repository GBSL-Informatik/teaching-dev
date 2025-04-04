import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import { useStore } from '@tdev-hooks/useStore';
import Loader from '@tdev-components/Loader';
import { formatSeconds } from '@tdev-components/util/timeHelpers';

interface Props {
    label: string;
    children: React.ReactNode;
    nextGuessIn: number;
}

const AdventureOption = observer((props: Props) => {
    const pageStore = useStore('pageStore');
    const page = pageStore.current;
    const [counter, setCounter] = React.useState(Date.now());
    const skippedCounter = React.useRef<number>(null);
    React.useEffect(() => {
        if (page) {
            page.setInitialGuessTime(Date.now() - (props.nextGuessIn + 1) * 1000);
        }
    }, [page]);

    React.useEffect(() => {
        if (!page) {
            return;
        }
        const now = Date.now();
        if (now < page.lastGuessedAt() + props.nextGuessIn * 1000) {
            if (skippedCounter.current !== counter) {
                setCounter(now);
                skippedCounter.current = now;
            }
            const tDisposer = setTimeout(() => {
                setCounter(Date.now());
            }, 1000);
            return () => clearTimeout(tDisposer);
        }
    }, [counter, page, page?.activeSolution, props.nextGuessIn, skippedCounter, page?._initialGuessTime]);

    const { front, back } = React.useMemo(() => {
        if (!Array.isArray(props.children)) {
            return { front: props.children, back: 'Rückseite' };
        }
        const splitIdx = props.children.findIndex((e) => e.type === 'hr');
        if (splitIdx < 0) {
            return { front: props.children, back: 'Rückseite' };
        }
        const front = props.children.slice(0, splitIdx);
        const back = props.children.slice(splitIdx + 1);
        return { front, back: back.length === 0 ? 'Rückseite' : back };
    }, [props.children]);

    const timeLeft = React.useMemo(() => {
        if (!page) {
            return 1;
        }
        return page.lastGuessedAt() + props.nextGuessIn * 1000 - counter;
    }, [page, counter, page?.activeSolution, props.nextGuessIn]);
    if (!page) {
        return null;
    }

    const isFlipped = page.activeSolution === props.label;

    return (
        <div
            className={clsx('card', styles.card, styles.flipCard, isFlipped && styles.flipped)}
            onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                page.flipOption(props.label, props.nextGuessIn * 1000);
            }}
        >
            <div className={clsx('card__body', styles.body)}>
                <div className={clsx(styles.front)}>
                    <div>{front}</div>
                </div>
                <div className={clsx(styles.back)}>
                    <div>{back}</div>
                </div>
            </div>
            <div className={clsx('card__footer', styles.label)}>
                <h4>{props.label}</h4>
            </div>
            {!isFlipped && timeLeft > 0 && <Loader label={formatSeconds(timeLeft / 1000 + 1)} overlay />}
        </div>
    );
});

export default AdventureOption;
