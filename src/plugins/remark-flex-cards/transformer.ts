import { BlockContent, Image, Node, Paragraph, Parent, PhrasingContent, Root, RootContent } from 'mdast';
import { LeafDirective } from 'mdast-util-directive';
import type { MdxJsxFlowElement } from 'mdast-util-mdx';
import { SKIP, visit } from 'unist-util-visit';
import { type Options, toJsxAttribute } from '../helpers';
import { flexContainerOptions, flexItemOptions } from './flexOptions';
import { ContainerDirectiveName, DirectiveBreak, DirectiveCard, DirectiveFlex } from './plugin';

const generateImage = (
    image: Paragraph
): MdxJsxFlowElement & { data: { type: 'image'; _mdxExplicitJsx: boolean } } => {
    return {
        type: 'mdxJsxFlowElement',
        name: 'div',
        attributes: [toJsxAttribute('className', 'card__image')],
        children: [image],
        data: {
            type: 'image',
            _mdxExplicitJsx: true
        }
    };
};

const visitItems = (
    name: ContainerDirectiveName,
    container: MdxJsxFlowElement | Parent,
    config: Config,
    defaultStyle: { [key: string]: string | boolean } = {}
) => {
    let currentItem: MdxJsxFlowElement | Parent | undefined = undefined;
    let currentContent: MdxJsxFlowElement | Parent | undefined = undefined;
    const flushContent = () => {
        // ensures that a new item is created next time
        currentContent = undefined;
    };
    const setItem = (item: MdxJsxFlowElement | Parent) => {
        currentItem = item;
        flushContent();
    };
    visit(container, (node, idx, parent) => {
        if (!parent) {
            return;
        }
        if (node.type === 'leafDirective' && (node as LeafDirective).name === DirectiveBreak) {
            const directive = node as LeafDirective;
            const attributes = flexItemOptions(directive.attributes, defaultStyle);
            const item = config.flexItem(name, attributes);
            parent.children.splice(idx || 0, 1, item as BlockContent);
            setItem(item);
            return SKIP;
        }
        /** ensure at least one item is present */
        if (!currentItem) {
            const attributes = flexItemOptions(null, defaultStyle);
            const item = config.flexItem(name, attributes);
            currentItem = item;
            /**
             * insert the new block before the current node
             */
            parent.children.splice(idx || 0, 0, item as BlockContent);
            // and visit the current node again
            return [SKIP, idx || 0 + 1];
        }
        /** flatten paragraphs */
        if (node.type === 'paragraph') {
            parent.children.splice(idx || 0, 1, ...(node as Paragraph).children);
            return [SKIP, idx];
        }
        /** process image */
        if (
            !config.skipCardImageProcessing &&
            name === DirectiveCard &&
            (node.type === 'image' || config.wrapInCardImage?.(node))
        ) {
            const image = generateImage({
                type: 'paragraph',
                children: [node as Image]
            });
            currentItem.children.push(image);
            parent.children.splice(idx || 0, 1);
            flushContent();
            return [SKIP, idx];
        }
        // use the last item as the current item - maybe an image was added directly to the item
        if (!currentContent && config.itemContent) {
            currentContent = config.itemContent(name);
            currentItem.children.push(currentContent as BlockContent);
        }
        if (config.itemContent) {
            currentContent!.children.push(node as BlockContent);
        } else {
            currentItem.children.push(node as BlockContent);
        }
        parent.children.splice(idx || 0, 1);
        /** since the current position was removed, visit the current index again */
        return [SKIP, idx];
    });
};

interface Config {
    skipCardImageProcessing?: boolean;
    flex: (
        name: ContainerDirectiveName,
        children: RootContent[] | PhrasingContent[],
        options: Options
    ) => MdxJsxFlowElement | Parent;
    flexItem: (name: ContainerDirectiveName, options: Options) => MdxJsxFlowElement | Parent;
    itemContent?: (name: ContainerDirectiveName) => MdxJsxFlowElement | Parent;
    wrapInCardImage?: (node: Node) => boolean;
}

export const transformer = (ast: Root | MdxJsxFlowElement | Parent, config: Config) => {
    const ContainerName = new Set([DirectiveCard, DirectiveFlex]);
    visit(ast, 'containerDirective', (node, idx, parent) => {
        if (!parent) {
            return;
        }
        const name = node.name as ContainerDirectiveName;
        if (!ContainerName.has(name)) {
            return;
        }
        const { options: attributes, itemStyle } = flexContainerOptions(node.attributes as any);
        const container = config.flex(name, node.children, attributes);
        transformer(container, config);
        parent.children.splice(idx || 0, 1, container as BlockContent);
        visitItems(name, container, config, itemStyle);
    });
};
