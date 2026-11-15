import type { Literal, Parent, PhrasingContent } from 'mdast';
import type { Options as ToMarkdownOptions } from 'mdast-util-to-markdown';

/**
 * Teaching-Dev specific phrasing nodes. They only exist while serializing,
 * the regular remark pipeline turns their syntax into jsx at build time.
 */

/** `__text__`, rendered as a boxed text by `remark-strong` */
export interface Box extends Parent {
    type: 'box';
    children: PhrasingContent[];
}

/** `[[Ctrl]]`, rendered as keyboard key by `remark-kbd` */
export interface Kbd extends Parent {
    type: 'kbd';
    children: PhrasingContent[];
}

/** markdown which is written to the output as-is */
export interface Verbatim extends Literal {
    type: 'verbatim';
    value: string;
}

declare module 'mdast' {
    interface PhrasingContentMap {
        box: Box;
        kbd: Kbd;
        verbatim: Verbatim;
    }
    interface RootContentMap {
        box: Box;
        kbd: Kbd;
        verbatim: Verbatim;
    }
}

export const customToMarkdown: ToMarkdownOptions = {
    handlers: {
        box(node: Box, _, state, info) {
            const exit = state.enter('emphasis');
            const value = state.containerPhrasing(node, { ...info, before: '_', after: '_' });
            exit();
            return `__${value}__`;
        },
        kbd(node: Kbd, _, state, info) {
            const exit = state.enter('label');
            const value = state.containerPhrasing(node, { ...info, before: '[', after: ']' });
            exit();
            return `[[${value}]]`;
        },
        verbatim(node: Verbatim) {
            return node.value;
        }
    }
};
