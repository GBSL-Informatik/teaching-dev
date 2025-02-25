import React from 'react';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import styles from './styles.module.scss';

type BadgeType = 'primary' | 'secondary' | 'blue' | 'success' | 'info' | 'warning' | 'danger';

export type Color = 'blue' | 'lightBlue' | 'green' | 'orange' | 'black' | 'red' | 'gray';

export const getType = (color?: Color | string): BadgeType | undefined => {
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
    color?: Color | string;
    textColor?: string;
}

const Badge = observer((props: Props) => {
    const badgeType = React.useMemo(() => {
        return props.type || getType(props.color);
    }, [props.type, props.color]);
    const style = React.useMemo(() => {
        if (badgeType || !props.color) {
            return props.style;
        }
        const colors: Record<string, string> = {
            ['--ifm-color-primary']: props.color,
            ['--ifm-badge-color']: props.textColor || 'var(--ifm-color-white)'
        };
        return {
            ...(props.style || {}),
            ...colors
        };
    }, [props.style, props.color, props.textColor, badgeType]);
    return (
        <span
            className={clsx(
                styles.badge,
                'badge',
                `badge--${badgeType || (props.color ? 'primary' : 'secondary')}`,
                (props.noPaddingLeft || props.noPadding) && styles.noPaddingLeft,
                (props.noPaddingRight || props.noPadding) && styles.noPaddingRight,
                props.color && badgeType && styles[props.color],
                props.className
            )}
            style={style}
            title={props.title}
        >
            {props.children}
        </span>
    );
});

export default Badge;
