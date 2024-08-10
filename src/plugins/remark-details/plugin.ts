import { visit } from 'unist-util-visit';
import type { Plugin, Processor, Transformer } from 'unified';
import { Content, Parent } from 'mdast';
import { ContainerDirective } from 'mdast-util-directive';
import { MdxJsxFlowElement } from 'mdast-util-mdx';

const plugin: Plugin = function plugin(
    this: Processor,
    optionsInput?: {
        tagNames?: {
            details?: string;
            summary?: string;
        };
        classNames?: {
            details?: string;
            summary?: string;
        };
    }
): Transformer {
    const TAG_NAMES = { details: 'details', summary: 'summary', ...optionsInput?.tagNames };
    const getClassNameAttribute = (tag: 'details' | 'summary') => {
        const className = (optionsInput?.classNames || {})[tag];
        return className ? [{ type: 'mdxJsxAttribute', name: 'className', value: className }] : [];
    };

    return async (ast, vfile) => {
        visit(ast, (node, idx, parent: Parent) => {
            if (
                node.type !== 'containerDirective' ||
                (node as unknown as ContainerDirective).name !== 'details'
            ) {
                return;
            }
            const container = node as unknown as ContainerDirective;
            const label = container.children.filter(
                (child) => (child.data as { directiveLabel: boolean })?.directiveLabel
            ) as Content[];
            const content = container.children.filter(
                (child) => !(child.data as { directiveLabel: boolean })?.directiveLabel
            ) as Content[];
            const children: Content[] = [...content];
            if (label.length > 0) {
                children.splice(0, 0, {
                    type: 'mdxJsxFlowElement',
                    name: TAG_NAMES.summary,
                    attributes: [...getClassNameAttribute('summary')],
                    children: label,
                    data: {
                        _mdxExplicitJsx: true
                    }
                } as MdxJsxFlowElement);
            }
            const details = {
                type: 'mdxJsxFlowElement',
                name: TAG_NAMES.details,
                attributes: [...getClassNameAttribute('details')],
                children: children,
                data: {
                    _mdxExplicitJsx: true
                }
            } as MdxJsxFlowElement;
            parent.children.splice(idx || 0, 1, details);
        });
    };
};

export default plugin;
