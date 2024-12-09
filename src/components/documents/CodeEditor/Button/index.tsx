import * as React from 'react';
import styles from './styles.module.scss';
import clsx from 'clsx';
import Icon from '@mdi/react';
import useIsBrowser from '@docusaurus/useIsBrowser';

export enum Color {
    Primary = 'button--primary',
    Secondary = 'button--secondary',
    Success = 'button--success',
    Info = 'button--info',
    Warning = 'button--warning',
    Danger = 'button--danger',
    Link = 'button--link'
}
export enum Size {
    Small = 'button--sm',
    Large = 'button--lg'
}

export interface Props {
    icon: string;
    title?: string;
    onClick?: React.MouseEventHandler<HTMLButtonElement>;
    size?: Size;
    iconSize?: string;
    spin?: boolean;
    color?: Color;
    className?: string;
}

const Button = (props: Props) => {
    const isBrowser = useIsBrowser();
    return (
        <button
            className={clsx(
                'button',
                props.color || Color.Secondary,
                props.size || Size.Small,
                styles.button,
                props.className
            )}
            onClick={props.onClick}
            title={props.title}
        >
            <Icon
                path={props.icon}
                className={styles.icon}
                spin={isBrowser && props.spin}
                size={props.iconSize || '1.6em'}
            />
        </button>
    );
};

export default Button;
