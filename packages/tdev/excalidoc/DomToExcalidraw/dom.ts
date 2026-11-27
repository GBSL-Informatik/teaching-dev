// `.katex-mathml` is the visually hidden MathML of a formula, for screen readers
const IGNORED_SELECTOR = 'button, script, style, noscript, template, .hash-link, .katex-mathml';

export const isIgnored = (element: Element) => element.matches(IGNORED_SELECTOR);

export const isVisible = (element: Element, style: CSSStyleDeclaration) => {
    if (style.display === 'none' || style.visibility === 'hidden') {
        return false;
    }
    const rect = element.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
};

/**
 * Elements that are converted as a whole and never split into text and boxes.
 * KaTeX wraps long inline formulas between their `.base` boxes, so each box is converted on its own.
 */
const REPLACED_SELECTOR = 'img, svg, canvas, video, iframe, .katex-html > .base';

export const isReplaced = (element: Element) => element.matches(REPLACED_SELECTOR);

/**
 * Elements whose content flows into the text of their parent block, e.g. `<strong>` or `<a>`.
 * `display: contents` has no box of its own, so its children belong to the parent as well.
 */
export const isInlineFlow = (element: Element, style: CSSStyleDeclaration) => {
    if (isReplaced(element)) {
        return false;
    }
    return style.display === 'inline' || style.display === 'contents';
};
