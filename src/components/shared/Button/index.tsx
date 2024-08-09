import React, { MouseEventHandler, type ReactNode } from 'react';
import clsx from 'clsx';

import styles from './styles.module.scss';
import { ApiState } from '@site/src/stores/iStore';
import Link from '@docusaurus/Link';
import { Color, getButtonColorClass } from '../Colors';
import Icon from '@mdi/react';

export const POPUP_BUTTON_STYLE = clsx(
    styles.button,
    styles.reducedPadding,
    styles.iconLeft,
    styles.popupButton,
    'button',
    'button--outline',
    'button--primary'
);

export interface Base {
    onClick?: MouseEventHandler<HTMLButtonElement>;
    title?: string;
    apiState?: ApiState;
    apiIconSize?: number;
    href?: string;
    target?: '_blank' | `_self`;
    iconSide?: 'left' | 'right';
    noOutline?: boolean;
    text?: string;
    active?: boolean;
    className?: string;
    disabled?: boolean;
    size?: number;
    color?: Color | string;
}
interface IconProps extends Base {
    icon: ReactNode | string;
    text?: never;
    children?: never;
}
interface TextProps extends Base {
    icon?: never;
    text: string;
    children?: never;
}
interface TextIconProps extends Base {
    icon: ReactNode | string;
    text: string;
    children?: never;
}
interface ChildrenProps extends Base {
    icon?: ReactNode | string;
    text?: never;
    children: ReactNode | ReactNode[];
}

type Props = IconProps | TextProps | ChildrenProps | TextIconProps;

export const extractSharedProps = (props: Base) => {
    return {
        text: props.text,
        iconSide: props.iconSide,
        noOutline: props.noOutline,
        href: props.href,
        disabled: props.disabled,
        apiState: props.apiState,
        apiIconSize: props.apiIconSize,
        color: props.color,
        size: props.size
    };
};

export const ButtonIcon = (props: Props) => {
    let icon = props.icon;
    if (typeof icon === 'string') {
        icon = <Icon path={icon} size={props.size || 1} />;
    }
    return <>{icon && <span className={clsx(styles.icon, props.className)}>{icon}</span>}</>;
};

const ButtonInner = (props: Props) => {
    const textAndIcon = (props.children || props.text) && props.icon;
    const iconSide = textAndIcon ? (props.iconSide ?? 'right') : 'center';
    return (
        <>
            {props.icon && iconSide === 'left' && <ButtonIcon {...props} className={clsx(undefined)} />}
            <span
                className={clsx(styles.spacer, textAndIcon && iconSide === 'left' && styles.borderLeft)}
            ></span>
            {props.text && <span>{props.text}</span>}
            {props.children && props.children}
            {props.icon && iconSide === 'center' && <ButtonIcon {...props} className={clsx(undefined)} />}
            <span
                className={clsx(styles.spacer, textAndIcon && iconSide === 'right' && styles.borderRight)}
            ></span>
            {props.icon && iconSide === 'right' && <ButtonIcon {...props} className={clsx(undefined)} />}
        </>
    );
};

const Button = (props: Props) => {
    const textAndIcon = (props.children || props.text) && props.icon;
    const textOnly = props.text && !(props.children || props.icon);
    let colorCls = getButtonColorClass(props.color, props.color ? undefined : 'secondary');
    const style: React.CSSProperties = {};
    if (props.color && !colorCls) {
        (style as any)['--ifm-color-primary'] = props.color;
        (style as any)['--ifm-color-primary-darker'] = props.color;
        colorCls = 'button--primary';
    }
    const commonCls = clsx(
        styles.button,
        props.active && 'button--active',
        !textAndIcon && props.icon && styles.reducedPadding,
        props.children && styles.reducedPadding,
        props.icon && (props.iconSide === 'left' ? styles.iconLeft : styles.iconRight),
        textOnly && styles.soloText,
        'button',
        !props.noOutline && 'button--outline',
        props.disabled && styles.disabled,
        colorCls,
        props.className
    );
    if (props.href) {
        /** it is a link, styled as a button */
        return (
            <Link
                to={props.disabled ? '#' : props.href}
                target={props.target}
                className={clsx(styles.link, commonCls)}
                style={style}
            >
                <span className={clsx(styles.buttonInner)}>
                    <ButtonInner {...props} />
                </span>
            </Link>
        );
    }
    return (
        <button
            type="button"
            className={clsx(commonCls)}
            onClick={props.onClick}
            style={style}
            disabled={props.disabled}
        >
            <ButtonInner {...props} />
        </button>
    );
};

export default Button;
