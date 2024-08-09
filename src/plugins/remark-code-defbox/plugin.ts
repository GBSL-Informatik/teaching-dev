import { visit } from 'unist-util-visit';
import type { Plugin, Processor, Transformer } from 'unified';
import { Content, Paragraph, Parent } from 'mdast';
import { ContainerDirective } from 'mdast-util-directive';
import { MdxJsxFlowElement } from 'mdast-util-mdx';

const plugin: Plugin = function plugin(
    this: Processor,
    optionsInput?: {
        tagNames?: {
            definition?: string;
        };
    }
): Transformer {
    const TAG_NAME = optionsInput?.tagNames?.definition || 'def';

    return async (ast, vfile) => {
        visit(ast, (node, idx, parent: Parent) => {
            if (
                node.type !== 'containerDirective' ||
                (node as unknown as ContainerDirective).name !== TAG_NAME
            ) {
                return;
            }
            const directive = node as unknown as ContainerDirective;
            const heading = (
                directive.children.find((c) => c.type === 'paragraph' && c.data?.directiveLabel) as Paragraph
            )?.children;
            const content = directive.children.slice(heading ? 1 : 0);
            const depth = Math.max(Math.min(Number(directive.attributes.h) || 3, 6), 1) as
                | 1
                | 2
                | 3
                | 4
                | 5
                | 6;
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
