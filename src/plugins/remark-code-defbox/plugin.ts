import { Paragraph, Root } from 'mdast';
import { MdxJsxFlowElement } from 'mdast-util-mdx';
import type { Plugin, Transformer } from 'unified';

interface PluginOptions {
    tagNames?: {
        definition?: string;
    };
}

const plugin: Plugin<PluginOptions[], Root> = function plugin(this, optionsInput = {}): Transformer<Root> {
    const TAG_NAME = optionsInput.tagNames?.definition || 'def';
    return async (root) => {
        const { visit } = await import('unist-util-visit');
        visit(root, 'containerDirective', (node, idx, parent) => {
            if (!parent || idx === undefined || node.name !== TAG_NAME) {
                return;
            }
            const heading = (
                node.children.find((c) => c.type === 'paragraph' && c.data?.directiveLabel) as Paragraph
            )?.children;
            const content = node.children.slice(heading ? 1 : 0);
            const depth = Math.max(Math.min(Number(node.attributes!.h) || 3, 6), 1) as 1 | 2 | 3 | 4 | 5 | 6;
            const defbox: MdxJsxFlowElement = {
                type: 'mdxJsxFlowElement',
                name: 'DefBox',
                attributes: [],
                children: [
                    {
                        type: 'mdxJsxFlowElement',
                        name: 'DefHeading',
                        attributes: [],
                        children: [
                            {
                                type: 'heading',
                                depth: depth,
                                children: heading || [{ type: 'text', value: 'Definition' }]
                            }
                        ]
                    },
                    {
                        type: 'mdxJsxFlowElement',
                        name: 'DefContent',
                        attributes: [],
                        children: content
                    }
                ]
            };
            parent.children.splice(idx, 1, defbox);
        });
    };
};

export default plugin;
