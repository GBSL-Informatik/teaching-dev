/** `--width=20em` in the alt text of an image, handled by `remark-images` */
const WIDTH_OPTION_REGEX = /(^|\s+)--width=(\S+)/;

export const widthOption = (alt: string) => WIDTH_OPTION_REGEX.exec(alt)?.[2];

export const withWidthOption = (alt: string, width: string) => {
    const option = `--width=${width}`;
    if (WIDTH_OPTION_REGEX.test(alt)) {
        return alt.replace(WIDTH_OPTION_REGEX, (_match, space: string) => `${space}${option}`);
    }
    return alt ? `${alt} ${option}` : option;
};

/** unitless widths are pixels, like in `@tdev-components/Figure` */
export const cssWidth = (width: string) => (/^\d+(\.\d*)?$/.test(width) ? `${width}px` : width);
