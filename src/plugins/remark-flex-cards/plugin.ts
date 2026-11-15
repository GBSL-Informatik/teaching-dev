import { Node, Root } from 'mdast';
import { MdxJsxFlowElement } from 'mdast-util-mdx-jsx';
import type { Plugin, Transformer } from 'unified';
import { toJsxAttribute } from '../helpers';
import { FLEX_CLASSES } from './flexOptions';
import { transformer } from './transformer';

export type ContainerDirectiveName = 'cards' | 'flex';
export const DirectiveCard = 'cards' as const;
export const DirectiveFlex = 'flex' as const;
export type LeafDirectiveName = 'br';
export const DirectiveBreak: LeafDirectiveName = 'br' as const;

interface OptionsInput {
    wrapInCardImage?: (node: Node) => boolean;
    skipCardImageProcessing?: boolean;
}

const plugin: Plugin<OptionsInput[], Root> = function plugin(this, optionsInput = {}): Transformer<Root> {
    const { skipCardImageProcessing, wrapInCardImage } = optionsInput;
    return async (ast, vfile) => {
        const a = [`${DirectiveCard}`, `${DirectiveFlex}`];
        transformer(ast, {
            flex: (name, children, options) => {
                const attributes = [
                    toJsxAttribute('className', `${FLEX_CLASSES[name].container} ${options.className}`.trim())
                ];
                if (Object.keys(options.style).length > 0) {
                    attributes.push(toJsxAttribute('style', options.style));
                }
                return {
                    type: 'mdxJsxFlowElement',
                    name: 'div',
                    attributes: attributes,
                    children: children
                } as MdxJsxFlowElement;
            },
            flexItem: (name, options) => {
                const attributes = [
                    toJsxAttribute('className', `${FLEX_CLASSES[name].item} ${options.className}`.trim())
                ];
                if (Object.keys(options.style).length > 0) {
                    attributes.push(toJsxAttribute('style', options.style));
                }
                return {
                    type: 'mdxJsxFlowElement',
                    name: 'div',
                    attributes: attributes,
                    children: []
                } as MdxJsxFlowElement;
            },
            itemContent: (name) => {
                return {
                    type: 'mdxJsxFlowElement',
                    name: 'div',
                    attributes: [toJsxAttribute('className', FLEX_CLASSES[name].content)],
                    children: []
                } as MdxJsxFlowElement;
            },
            skipCardImageProcessing: skipCardImageProcessing,
            wrapInCardImage: wrapInCardImage
        });
    };
};

export default plugin;
