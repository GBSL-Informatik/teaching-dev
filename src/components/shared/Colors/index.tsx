import clsx from 'clsx';
import styles from './styles.module.scss';

export const Colors = {
    primary: styles.primary,
    secondary: styles.secondary,
    blue: styles.blue,
    green: styles.green,
    success: styles.green,
    red: styles.red,
    danger: styles.red,
    orange: styles.orange,
    warning: styles.orange,
    gray: styles.gray,
    lightBlue: styles.lightBlue,
    info: styles.gray,
    black: styles.black
};
export type Color = keyof typeof Colors;

export const ButtonColors: { [key in Color]: string } = {
    primary: 'button--primary',
    secondary: 'button--secondary',
    blue: 'button--primary',
    green: 'button--success',
    success: 'button--success',
    red: 'button--danger',
    danger: 'button--danger',
    orange: 'button--warning',
    warning: 'button--warning',
    gray: 'button--secondary',
    lightBlue: 'button--info',
    info: 'button--info',
    black: 'button--primary'
};
export const IfmColors: { [key in Color]: string } = {
    primary: 'var(--ifm-color-primary)',
    secondary: 'var(--ifm-color-secondary)',
    blue: 'var(--ifm-color-blue)',
    green: 'var(--ifm-color-success)',
    success: 'var(--ifm-color-success)',
    red: 'var(--ifm-color-danger)',
    danger: 'var(--ifm-color-danger)',
    orange: 'var(--ifm-color-warning)',
    warning: 'var(--ifm-color-warning)',
    gray: 'var(--ifm-color-secondary)',
    lightBlue: 'var(--ifm-color-info)',
    info: 'var(--ifm-color-info)',
    black: 'var(--ifm-color-black)'
} as const;

export const getColorClass = (color: Color | string | undefined, defaultColor?: Color) => {
    return Colors[color as Color] || Colors[defaultColor as Color];
};

export const getButtonColorClass = (color: Color | string | undefined, defaultColor?: Color) => {
    return clsx(
        ButtonColors[color as Color] || ButtonColors[defaultColor as Color],
        color === 'blue' && styles.buttonBlue,
        color === 'black' && styles.buttonBlack,
        color === 'gray' && styles.buttonGray
    );
};
