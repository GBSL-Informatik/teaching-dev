import type { PhrasingContent, Text } from 'mdast';
import type { Kbd } from './customNodes';

const OPEN = '[[';
const CLOSE = ']]';

const isBracket = (node: PhrasingContent, bracket: string): boolean => {
    return node.type === 'text' && node.value === bracket;
};

/**
 * Splits text nodes so that every `[[` and `]]` is a text node of its own.
 */
const splitBrackets = (children: PhrasingContent[]): PhrasingContent[] => {
    return children.flatMap((child): PhrasingContent[] => {
        if (child.type !== 'text') {
            return [child];
        }
        return child.value
            .split(/(\[\[|\]\])/)
            .filter((value) => value !== '')
            .map((value): Text => ({ type: 'text', value }));
    });
};

/**
 * Groups the siblings between `[[` and `]]` into a kbd node, as `remark-kbd` does at build time.
 * The content may span several nodes, e.g. `[[Ctrl + :mdi[keyboard-return]]]`.
 * Unmatched brackets stay text.
 */
export const groupKbd = (children: PhrasingContent[]): PhrasingContent[] => {
    const nodes = splitBrackets(children);
    const result: PhrasingContent[] = [];
    for (let idx = 0; idx < nodes.length; idx++) {
        const node = nodes[idx];
        const closeIdx = isBracket(node, OPEN)
            ? nodes.findIndex((other, otherIdx) => otherIdx > idx + 1 && isBracket(other, CLOSE))
            : -1;
        if (closeIdx < 0) {
            result.push(node);
            continue;
        }
        result.push({ type: 'kbd', children: nodes.slice(idx + 1, closeIdx) } satisfies Kbd);
        idx = closeIdx;
    }
    return result;
};
