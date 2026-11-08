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
