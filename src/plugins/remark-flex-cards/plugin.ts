import { visit, SKIP } from 'unist-util-visit';
import type { Plugin, Processor, Transformer } from 'unified';
import type { MdxJsxFlowElement } from 'mdast-util-mdx';
import { BlockContent, Content, DefinitionContent, Image, Paragraph, Parent } from 'mdast';
import { ContainerDirective, LeafDirective } from 'mdast-util-directive';
import { Options, toJsxAttribute, transformAttributes } from '../helpers';
import { Node } from 'unist';

/** for creating cards or flex: :::cards, :::flex */
enum ContainerDirectiveName {
    Cards = 'cards',
    Flex = 'flex'
}

enum LeafDirectiveNames {
    Break = 'br'
}
const MIN_WIDTH = '50px';

const configureFlexOptions = (options: Options) => {
    if (!('flexBasis' in options.style)) {
        const { columns, minWidth, gap } = options.style;
        const cols = columns ? Number.parseInt(columns as string, 10) : undefined;
        if (cols && minWidth) {
            options.style.flexBasis = `max(${minWidth}, ${100 / cols}% - calc(${cols - 1} * ${gap || '0.4em'}))`;
            delete options.style.columns;
            delete options.style.minWidth;
        } else if (cols) {
            options.style.flexBasis = `max(${MIN_WIDTH}, ${100 / cols}% - calc(${cols - 1} * ${gap || '0.4em'}))`;
            delete options.style.columns;
        } else if (minWidth) {
            options.style.flexBasis = minWidth;
            delete options.style.minWidth;
        }
    }
    return options;
};

const DEFAULT_CLASSES: {
    [key in ContainerDirectiveName]: { container: string; item: string; content: string };
} = {
    cards: {
        container: 'flex-cards flex',
        item: 'item card',
        content: 'card__body'
    },
    flex: {
        container: 'flex',
        item: 'item',
        content: 'content'
    }
};

const generateContent = (
    type: ContainerDirectiveName
): MdxJsxFlowElement & { data: { type: 'content'; _mdxExplicitJsx: boolean } } => {
    return {
        type: 'mdxJsxFlowElement',
        name: 'div',
        attributes: [
            {
                type: 'mdxJsxAttribute',
                name: 'className',
                value: DEFAULT_CLASSES[type].content
            }
        ],
        children: [],
        data: {
            type: 'content',
            _mdxExplicitJsx: true
        }
    };
};

const generateImage = (
    image: Paragraph
): MdxJsxFlowElement & { data: { type: 'image'; _mdxExplicitJsx: boolean } } => {
    return {
        type: 'mdxJsxFlowElement',
        name: 'div',
        attributes: [
            {
                type: 'mdxJsxAttribute',
                name: 'className',
                value: 'card__image'
            }
        ],
        children: [image],
        data: {
            type: 'image',
            _mdxExplicitJsx: true
        }
    };
};

const generateItem = (type: ContainerDirectiveName, className?: string): MdxJsxFlowElement => {
    return {
        type: 'mdxJsxFlowElement',
        name: 'div',
        attributes: [
            {
                type: 'mdxJsxAttribute',
                name: 'className',
                value: `${DEFAULT_CLASSES[type].item} ${className || ''}`.trim()
            }
        ],
        children: [],
        data: {
            _mdxExplicitJsx: true
        }
    } as MdxJsxFlowElement;
};

const visitChildren = (
    block: Node,
    type: ContainerDirectiveName,
    defaultStyle: { [key: string]: string | number | boolean } = {}
) => {
    const items: Parent[] = [];
    visit(block, (node, idx, parent: Parent) => {
        if (!parent) {
            return;
        }
        if (node.type === 'leafDirective' && (node as LeafDirective).name === LeafDirectiveNames.Break) {
            const directive = node as LeafDirective;
            const block = generateItem(type, directive.attributes?.class as any);
            const attributes = configureFlexOptions(transformAttributes(directive.attributes as any));
            const style = { ...attributes.style, ...defaultStyle };
            if (Object.keys(style).length > 0) {
                block.attributes.push(toJsxAttribute('style', style));
            }
            parent.children.splice(idx || 0, 1, block);
            items.push(block);
            return SKIP;
        }
        /** ensure at least one item is present */
        if (items.length === 0) {
            const item = generateItem(type);
            if (Object.keys(defaultStyle).length > 0) {
                item.attributes.push(toJsxAttribute('style', defaultStyle));
            }
            items.push(item);
            /**
             * insert the new block before the current node
             */
            parent.children.splice(idx || 0, 0, item);
            // and visit the current node again
            return [SKIP, idx || 0 + 1];
        }
        /** flatten images in paragraphs */
        if (type === ContainerDirectiveName.Cards && node.type === 'paragraph') {
            parent.children.splice(idx || 0, 1, ...(node as Paragraph).children);
            return [SKIP, idx];
        }
        const item = items[items.length - 1];
        /** process image */
        if (type === ContainerDirectiveName.Cards && node.type === 'image') {
            const image = generateImage({
                type: 'paragraph',
                children: [node as Image]
            });
            item.children.push(image);
            parent.children.splice(idx || 0, 1);
            return [SKIP, idx];
        }
        let content = item.children[item.children.length - 1] as Parent;
        if (!content || (content.data as { type?: string })?.type !== 'content') {
            content = generateContent(type);
            item.children.push(content as MdxJsxFlowElement);
        }
        content.children.push(node as Content);
        parent.children.splice(idx || 0, 1);
        /** since the current position was removed, visit the current index again */
        return [SKIP, idx];
    });
};

const visitor = (ast: Node) => {
    visit(ast, (node, idx, parent: Parent) => {
        if (node.type !== 'containerDirective') {
            return;
        }
        const container = node as ContainerDirective;
        if (!Object.values(ContainerDirectiveName).includes(container.name as ContainerDirectiveName)) {
            return;
        }
        const type = container.name as ContainerDirectiveName;
        const attributes = configureFlexOptions(transformAttributes(container.attributes as any));
        const itemStyle: { [key: string]: string | number | boolean } = {};
        if ('flexBasis' in attributes.style) {
            itemStyle.flexBasis = attributes.style.flexBasis;
            delete attributes.style.flexBasis;
        }

        const block = {
            type: 'mdxJsxFlowElement',
            name: 'div',
            attributes: [
                {
                    type: 'mdxJsxAttribute',
                    name: 'className',
                    value: `${DEFAULT_CLASSES[type].container} ${attributes.className}`.trim()
                }
            ],
            children: container.children as (BlockContent | DefinitionContent)[],
            data: {
                _mdxExplicitJsx: true
            }
        } as MdxJsxFlowElement;
        if (Object.keys(attributes.style).length > 0) {
            block.attributes.push(toJsxAttribute('style', attributes.style));
        }
        visitor(block);
        parent.children.splice(idx || 0, 1, block);
        visitChildren(block, type, itemStyle);
    });
};

const plugin: Plugin = function plugin(this: Processor, optionsInput?: {}): Transformer {
    return async (ast, vfile) => {
        visitor(ast);
    };
};

export default plugin;
