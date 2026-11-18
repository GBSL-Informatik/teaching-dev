export type InfimaType = 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'danger';

/**
 * The Infima type (e.g. for `button--<type>` or `alert--<type>`) of each color name.
 * Kept free of style imports, so that remark plugins can use it at build time.
 */
export const InfimaTypes = {
    primary: 'primary',
    secondary: 'secondary',
    blue: 'primary',
    green: 'success',
    success: 'success',
    red: 'danger',
    danger: 'danger',
    orange: 'warning',
    warning: 'warning',
    gray: 'secondary',
    grey: 'secondary',
    lightBlue: 'info',
    info: 'info',
    black: 'primary'
} as const satisfies Record<string, InfimaType>;

export type Color = keyof typeof InfimaTypes;
