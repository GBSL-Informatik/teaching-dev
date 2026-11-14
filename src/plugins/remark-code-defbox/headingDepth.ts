/** the heading depth of a `:::def` label, from its `h` attribute: `h3` by default */
export const defHeadingDepth = (h: unknown) =>
    Math.max(Math.min(Number(h) || 3, 6), 1) as 1 | 2 | 3 | 4 | 5 | 6;
