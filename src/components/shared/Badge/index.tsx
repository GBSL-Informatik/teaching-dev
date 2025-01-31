import React from 'react';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import styles from './styles.module.scss';

type BadgeType = 'primary' | 'secondary' | 'blue' | 'success' | 'info' | 'warning' | 'danger';

interface Props {
    className?: string;
    children: React.ReactNode;
    type?: BadgeType;
    noPadding?: boolean;
    noPaddingLeft?: boolean;
    noPaddingRight?: boolean;
    title?: string;
    style?: React.CSSProperties;
}

const Badge = observer((props: Props) => {
    return (
        <span
            className={clsx(
                styles.badge,
                'badge',
                `badge--${props.type || 'secondary'}`,
                (props.noPaddingLeft || props.noPadding) && styles.noPaddingLeft,
                (props.noPaddingRight || props.noPadding) && styles.noPaddingRight,
                props.className
            )}
            style={props.style}
            title={props.title}
        >
            {props.children}
        </span>
    );
});

export default Badge;
