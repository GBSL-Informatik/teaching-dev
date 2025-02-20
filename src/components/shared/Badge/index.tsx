import React from 'react';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import styles from './styles.module.scss';

type BadgeType = 'primary' | 'secondary' | 'blue' | 'success' | 'info' | 'warning' | 'danger';

type Color = 'blue' | 'lightBlue' | 'green' | 'orange' | 'black' | 'red' | 'gray';

const getType = (color?: Color): BadgeType | undefined => {
    switch (color) {
        case 'blue':
            return 'primary';
        case 'green':
            return 'success';
        case 'orange':
            return 'warning';
        case 'black':
            return 'primary';
        case 'red':
            return 'danger';
        case 'lightBlue':
            return 'info';
        case 'gray':
            return 'secondary';
    }
};

interface Props {
    className?: string;
    children: React.ReactNode;
    type?: BadgeType;
    noPadding?: boolean;
    noPaddingLeft?: boolean;
    noPaddingRight?: boolean;
    title?: string;
    style?: React.CSSProperties;
    color?: Color;
}

const Badge = observer((props: Props) => {
    return (
        <span
            className={clsx(
                styles.badge,
                'badge',
                `badge--${props.type || getType(props.color) || 'secondary'}`,
                (props.noPaddingLeft || props.noPadding) && styles.noPaddingLeft,
                (props.noPaddingRight || props.noPadding) && styles.noPaddingRight,
                props.color && styles[props.color],
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
