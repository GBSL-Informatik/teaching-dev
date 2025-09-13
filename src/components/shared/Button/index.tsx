import React, { MouseEventHandler, type ReactNode } from 'react';
import clsx from 'clsx';

import styles from './styles.module.scss';
import Link from '@docusaurus/Link';
import { Color, getButtonColorClass } from '../Colors';
import Icon from '@mdi/react';
import useIsBrowser from '@docusaurus/useIsBrowser';

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
    onMouseDown?: MouseEventHandler<HTMLButtonElement>;
    onMouseUp?: MouseEventHandler<HTMLButtonElement>;
    title?: string;
    href?: string;
    target?: '_blank' | `_self`;
    iconSide?: 'left' | 'right';
    noOutline?: boolean;
    text?: string | undefined;
    active?: boolean;
    className?: string;
    textClassName?: string /* can be used to disable the text over css with `display: none` */;
    disabled?: boolean;
    size?: number;
    color?: Color | string;
    spin?: boolean | number;
    noBorder?: boolean;
    type?: 'button' | 'submit' | 'reset';
    floatingIcon?: ReactNode;
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
        color: props.color,
        size: props.size
    };
};

export const ButtonIcon = (props: Props) => {
    let icon = props.icon;
    const isBrowser = useIsBrowser();
    if (typeof icon === 'string') {
        icon = <Icon path={icon} size={props.size || 1} spin={isBrowser && props.spin} />;
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
                className={clsx(
                    styles.spacer,
                    textAndIcon && iconSide === 'left' && styles.borderLeft,
                    props.textClassName
                )}
            ></span>
            {props.text && (
                <span className={clsx(styles.text, textAndIcon && styles[iconSide], props.textClassName)}>
                    {props.text}
                </span>
            )}
            {props.children && props.children}
            {props.icon && iconSide === 'center' && <ButtonIcon {...props} className={clsx(undefined)} />}
            <span
                className={clsx(
                    styles.spacer,
                    textAndIcon && iconSide === 'right' && styles.borderRight,
                    props.textClassName
                )}
            ></span>
            {props.icon && iconSide === 'right' && (
                <ButtonIcon {...props} className={clsx(props.textClassName)} />
            )}
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
                className={clsx(styles.link, commonCls, props.noBorder && styles.noBorder)}
                style={style}
            >
                <span className={clsx(styles.buttonInner)}>
                    <ButtonInner {...props} />
                </span>
                {props.floatingIcon && <span className={styles.floatingIcon}>{props.floatingIcon}</span>}
            </Link>
        );
    }
    return (
        <button
            type={props.type || 'button'}
            className={clsx(commonCls, props.noBorder && styles.noBorder)}
            onClick={props.onClick}
            style={style}
            disabled={props.disabled}
            title={props.title}
            onMouseDown={props.onMouseDown}
            onMouseUp={props.onMouseUp}
        >
            <ButtonInner {...props} />
            {props.floatingIcon && <span className={styles.floatingIcon}>{props.floatingIcon}</span>}
        </button>
    );
};

export default Button;
