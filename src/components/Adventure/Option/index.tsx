import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import { useStore } from '@tdev-hooks/useStore';

interface Props {
    label: string;
    children: React.ReactNode;
    nextGuessIn: number;
}

const Option = observer((props: Props) => {
    const pageStore = useStore('pageStore');
    const { front, back } = React.useMemo(() => {
        if (!Array.isArray(props.children)) {
            return { front: props.children, back: 'Rückseite' };
        }
        const splitIdx = props.children.findIndex((e) => e.type === 'hr');
        if (splitIdx < 0) {
            return { front: props.children, back: 'Rückseite' };
        }
        const front = props.children.slice(0, splitIdx);
        const back = props.children.slice(splitIdx + 2);
        return { front, back: back.length === 0 ? 'Rückseite' : back };
    }, [props.children]);
    const page = pageStore.current;
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
                page.flipOption(props.label, props.nextGuessIn);
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
        </div>
    );
});

export default Option;
