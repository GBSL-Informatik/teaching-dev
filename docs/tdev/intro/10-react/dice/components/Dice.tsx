import React from 'react';
import styles from './Dice.module.css';
import clsx from 'clsx';

const rollDice = () => {
    return Math.floor(Math.random() * 6) + 1;
};

const Dice = () => {
    const [num, setNum] = React.useState(rollDice());
    const [isRolling, setIsRolling] = React.useState(false);

    React.useEffect(() => {
        if (isRolling) {
            const interval = setInterval(() => {
                setIsRolling(false);
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [isRolling]);

    return (
        <div
            className={clsx(styles.dice, isRolling && styles.isRolling)}
            onClick={() => {
                setNum(rollDice());
                setIsRolling(true);
            }}
        >
            {num}
        </div>
    );
};

export default Dice;
