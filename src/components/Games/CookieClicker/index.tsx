import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';

const CookieClicker = () => {
    const [score, setScore] = React.useState(0);
    return (
        <div className="card">
            <div className={clsx(styles.score, 'card__header')}>
                <h4>Score: {score}</h4>
            </div>
            <div className={clsx('card__body', styles.cookie)}>
                <div onClick={() => setScore((s) => s + 1)}>
                    <img
                        src={require('./images/cookie.png').default}
                        style={{
                            transform: `rotate(${score * 30}deg)`
                        }}
                        className={styles.image}
                    />
                </div>
            </div>
            <div className={'card__footer'}>
                <button onClick={() => setScore(0)} className="button button--primary button--block">
                    Zurücksetzen
                </button>
            </div>
        </div>
    );
};

export default CookieClicker;
