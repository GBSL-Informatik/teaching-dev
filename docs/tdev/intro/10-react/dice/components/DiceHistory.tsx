import React from 'react';
import styles from './Dice.module.css';
import clsx from 'clsx';

const rollDice = () => {
    return Math.floor(Math.random() * 6) + 1;
};

interface Props {
    onRoll?: () => void;
    isRolling?: boolean;
    num: number | null;
}

const Dice = (props: Props) => {
    return (
        <div
            className={clsx(styles.dice, props.isRolling && styles.isRolling)}
            onClick={props.onRoll}
        >
            {props.num ?? ''}
        </div>
    );
};

const DiceHistory = () => {
    const [num, setNum] = React.useState(rollDice());
    const [isRolling, setIsRolling] = React.useState(false);
    const [history, setHistory] = React.useState<(number | null)[]>([null, null, null, null, null]);

    React.useEffect(() => {
        if (isRolling) {
            const interval = setInterval(() => {
                setIsRolling(false);
                setHistory((prev) => [num, ...prev].slice(0, 5));
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [isRolling, num]);

    return (
        <div className={clsx(styles.container)}>
            <Dice
                num={num}
                isRolling={isRolling}
                onRoll={() => {
                    setNum(rollDice());
                    setIsRolling(true);
                }} 
            />
            <div className={clsx(styles.history)}>
                {history.map((val, idx) => {
                    return <Dice num={val} key={idx} />;
                })}
            </div>
        </div>
    );
};

export default DiceHistory;
