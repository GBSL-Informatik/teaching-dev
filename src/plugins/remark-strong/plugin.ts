import { visit } from 'unist-util-visit';
import type { Plugin, Transformer } from 'unified';
import type { MdxJsxTextElement } from 'mdast-util-mdx';
import type { Parent, PhrasingContent, Root, RootContent } from 'mdast';

interface OptionsInput {
    tagName?: string;
    className?: string;
}

type BoxNode = (children: RootContent[] | PhrasingContent[]) => PhrasingContent | Parent;

export const transformer = (ast: Root | Parent, source: string, boxNode: BoxNode) => {
    visit(ast, 'strong', (node, idx, parent) => {
        if (!parent || node.position === undefined || idx === undefined) {
            return;
        }
        const startOg = node.position.start.offset || 0;
        const endOg = node.position.end.offset;

        const strToOperateOn = source.substring(startOg, endOg);
        const wasUnderscored = strToOperateOn.startsWith('__') && strToOperateOn.endsWith('__');
        if (wasUnderscored) {
            parent.children.splice(idx, 1, boxNode(node.children) as PhrasingContent);
        }
    });
};

const plugin: Plugin<OptionsInput[], Root> = function plugin(optionsInput = {}): Transformer<Root> {
    return async (ast, vfile) => {
        const mdSource = vfile.value as string;
        transformer(ast, mdSource, (children) => {
            return {
                type: 'mdxJsxTextElement',
                name: optionsInput.tagName || 'strong',
                attributes: optionsInput.className
                    ? [{ type: 'mdxJsxAttribute', name: 'className', value: optionsInput.className }]
                    : [],
                children: children
            } as MdxJsxTextElement;
        });
    };
};

export default plugin;
