import { Link, Root, Text } from 'mdast';
import type { MdxJsxFlowElement } from 'mdast-util-mdx';
import type { Plugin, Transformer } from 'unified';
import { visit } from 'unist-util-visit';
import { requireDefaultMdastNode, toJsxAttribute } from '../helpers';
import { isMediaDirective, type MediaElement, mediaElement } from './mediaElement';

const toMdast = (element: MediaElement): MdxJsxFlowElement => {
    const attributes = Object.entries(element.attributes).map(([key, value]) => toJsxAttribute(key, value));
    if (element.requiredSrc) {
        attributes.unshift(requireDefaultMdastNode('src', element.requiredSrc));
    }
    return {
        type: 'mdxJsxFlowElement',
        name: element.name,
        attributes,
        children: element.children.map(toMdast),
        data: {}
    };
};

const plugin: Plugin<unknown[], Root> = function plugin(): Transformer<Root> {
    return async (ast, vfile) => {
        visit(ast, 'leafDirective', (node, idx, parent) => {
            if (!isMediaDirective(node.name) || !parent) {
                return;
            }
            const rawChild = node.children[0];
            const src =
                rawChild.type === 'text'
                    ? (rawChild as Text).value
                    : rawChild.type === 'link'
                      ? (rawChild as Link).url
                      : undefined;
            if (!src) {
                throw new Error(`Invalid child for ${node.name} directive in ${vfile.path}`);
            }
            const element = mediaElement(node.name, src, node.attributes);
            parent.children.splice(idx || 0, 1, toMdast(element));
        });
    };
};

export default plugin;
