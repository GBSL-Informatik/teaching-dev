const RGB_RE = /rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,\s/]+([\d.]+%?))?\s*\)/;

const toHex = (value: number) => Math.round(value).toString(16).padStart(2, '0');

const parseAlpha = (alpha: string | undefined) => {
    if (alpha === undefined) {
        return 1;
    }
    return alpha.endsWith('%') ? parseFloat(alpha) / 100 : parseFloat(alpha);
};

/**
 * Converts a computed css color (always `rgb()` or `rgba()`) to a hex color as used by Excalidraw.
 */
export const toExcalidrawColor = (cssColor: string): string => {
    const match = RGB_RE.exec(cssColor);
    if (!match) {
        return cssColor;
    }
    const [, red, green, blue, alphaValue] = match;
    const alpha = parseAlpha(alphaValue);
    if (alpha === 0) {
        return 'transparent';
    }
    const hex = `#${toHex(+red)}${toHex(+green)}${toHex(+blue)}`;
    return alpha < 1 ? `${hex}${toHex(alpha * 255)}` : hex;
};

export const isTransparent = (cssColor: string) => toExcalidrawColor(cssColor) === 'transparent';
