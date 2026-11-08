import { stringifyMdast } from './syntax';

/*
 * `remark-images` renders the markdown of the alt text as caption, e.g. `![**Fig. 1** Cat](cat.png)`.
 * mdast only keeps the plain text of the alt, so the markdown is read from and written to the source.
 */

/**
 * The alt text as written in the source of an image, e.g. `**Fig. 1** Cat` of `![**Fig. 1** Cat](cat.png)`.
 */
export const rawImageAlt = (imageSource: string): string | undefined => {
    if (!imageSource.startsWith('![')) {
        return undefined;
    }
    let depth = 0;
    for (let idx = 2; idx < imageSource.length; idx++) {
        const char = imageSource[idx];
        if (char === '\\') {
            idx++;
        } else if (char === '[') {
            depth++;
        } else if (char === ']') {
            if (depth === 0) {
                return imageSource.slice(2, idx);
            }
            depth--;
        }
    }
    return undefined;
};

/**
 * The markdown of an image, the alt text is written as it is (not escaped).
 */
export const imageMarkdown = (src: string, alt: string, title: string | null) => {
    const withoutAlt = stringifyMdast({ type: 'image', url: src, alt: '', title });
    return `![${alt}${withoutAlt.slice('!['.length)}`;
};
