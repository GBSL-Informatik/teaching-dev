import React from 'react';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import styles from './styles.module.scss';

type BadgeType = 'primary' | 'secondary' | 'blue' | 'success' | 'info' | 'warning' | 'danger';

interface Props {
    className?: string;
    children: React.ReactNode;
    type?: BadgeType;
    title?: string;
    style?: React.CSSProperties;
    onDiscard?: () => void;
}

const Alert = observer((props: Props) => {
    return (
        <div
            className={clsx(styles.alert, 'alert', `alert--${props.type || 'primary'}`, props.className)}
            style={props.style}
            title={props.title}
        >
            {props.onDiscard && (
                <button
                    aria-label="Close"
                    className="clean-btn close"
                    type="button"
                    onClick={props.onDiscard}
                >
                    <span aria-hidden="true">&times;</span>
                </button>
            )}
            {props.children}
        </div>
    );
});

export default Alert;
