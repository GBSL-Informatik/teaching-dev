import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import { useStore } from '@tdev-hooks/useStore';
import Card from '@tdev-components/shared/Card';

interface Props {
    children: React.ReactNode;
}

const Option = observer((props: Props) => {
    const [isFlipped, setIsFlipped] = React.useState(false);
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

    return (
        <div
            className={clsx('card', styles.card, styles.flipCard, isFlipped && styles.flipped)}
            onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsFlipped(!isFlipped);
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
        </div>
    );
});

export default Option;
