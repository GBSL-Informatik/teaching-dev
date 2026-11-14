/** image options like `--width=20em` or `@inline` in the alt text, handled by `remark-images` */
const OPTION_REGEX = /(^|\s+)(--[\w-]+(=\S+)?|@inline)(?=\s|$)/g;

/**
 * Splits the alt text into the caption (markdown) and the image options.
 */
export const splitAlt = (alt: string) => {
    const caption = alt.replace(OPTION_REGEX, '').trim();
    const options = [...alt.matchAll(OPTION_REGEX)].map((match) => match[2]);
    return { caption, options };
};

/** the options are appended to the caption */
export const joinAlt = (caption: string, options: string[]) => {
    return [caption, ...options].filter((part) => part).join(' ');
};

const WIDTH_OPTION = /^--width=(\S+)$/;

/** the width of `--width=20em` */
export const widthOption = (alt: string) => {
    const widths = splitAlt(alt).options.map((option) => WIDTH_OPTION.exec(option)?.[1]);
    return widths.find((width) => width !== undefined);
};

/** sets `--width=`, the other options are kept */
export const withWidthOption = (alt: string, width: string) => {
    const { caption, options } = splitAlt(alt);
    const otherOptions = options.filter((option) => !WIDTH_OPTION.test(option));
    return joinAlt(caption, [...otherOptions, `--width=${width}`]);
};

/** unitless widths are pixels, like in `@tdev-components/Figure` */
export const cssWidth = (width: string) => (/^\d+(\.\d*)?$/.test(width) ? `${width}px` : width);
