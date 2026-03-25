import { visit } from 'unist-util-visit';
import type { Plugin, Transformer } from 'unified';
import { Root, Text } from 'mdast';

interface OptionsInput {
    prefix?: string | null;
    postfix?: string | null;
}

const plugin: Plugin<OptionsInput[], Root> = function plugin(optionsInput = {}): Transformer<Root> {
    const prefix = optionsInput.prefix === undefined ? '👉' : optionsInput.prefix?.trim();
    const postfix = optionsInput.postfix?.trim() || null;

    return (tree) => {
        visit(tree, 'link', (node) => {
            if (node.url.startsWith('mailto:') || node.url.startsWith('tel:')) {
                return;
            }
            if (prefix) {
                if (node.children.length < 1 || node.children[0].type !== 'text') {
                    node.children.unshift({ type: 'text', value: `${prefix} ` } as Text);
                } else if (node.children[0].type === 'text') {
                    if (!node.children[0].value.startsWith(prefix)) {
                        node.children[0].value = `${prefix} ${node.children[0].value}`;
                    }
                }
            }
            if (postfix) {
                const lastLinkPos = node.children.length - 1;
                if (lastLinkPos < 0 || node.children[lastLinkPos].type !== 'text') {
                    node.children.push({ type: 'text', value: ` ${postfix}` } as Text);
                } else if (node.children[lastLinkPos].type === 'text') {
                    if (!node.children[lastLinkPos].value.endsWith(postfix)) {
                        node.children[lastLinkPos].value = `${node.children[lastLinkPos].value} ${postfix}`;
                    }
                }
            }
        });
    };
};

export default plugin;
