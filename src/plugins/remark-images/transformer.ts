import { visit, SKIP, CONTINUE } from 'unist-util-visit';
import type { MdxJsxFlowElement, MdxJsxTextElement } from 'mdast-util-mdx';
import { BlockContent, Image, Parent, PhrasingContent, Root, RootContent } from 'mdast';
import { cleanedText, ParsedOptions, parseOptions } from '../helpers';

const trimText = (nodes: PhrasingContent[], location: 'start' | 'end') => {
    const textNode = nodes[location === 'start' ? 0 : nodes.length - 1];
    if (textNode.type === 'text') {
        if (location === 'start') {
            textNode.value = textNode.value.trimStart();
        } else {
            textNode.value = textNode.value.trimEnd();
        }
    }
    return nodes;
};

const unshiftImagesFromParagraphs = (ast: Root) => {
    visit(ast, 'paragraph', (node, idx, parent) => {
        if (!parent || idx === undefined) {
            return;
        }
        const imageIndex = node.children.findIndex((n) => n.type === 'image');
        if (imageIndex >= 0) {
            const image = node.children.splice(imageIndex, 1)[0] as Image;
            if (/@inline/.test(image.alt || '')) {
                node.children.splice(imageIndex, 0, image);
                return CONTINUE;
            }
            if (node.children.length === 0) {
                parent.children.splice(idx, 1, image);
            } else if (imageIndex === 0) {
                /** was the first child */
                trimText(node.children, 'start');
                const first = node.children[0];
                if (first?.type === 'text' && first.value.length === 0) {
                    node.children.shift();
                }
                parent.children.splice(idx, 0, image as any as BlockContent);
            } else if (imageIndex === node.children.length) {
                /** was the last child */
                trimText(node.children, 'end');
                const last = node.children[node.children.length - 1];
                if (last?.type === 'text' && last.value.length === 0) {
                    node.children.pop();
                }
                parent.children.push(image as any as BlockContent);
            } else {
                const preChildren = node.children.splice(0, imageIndex);
                trimText(preChildren, 'end');
                const postChildren = node.children.slice();
                trimText(postChildren, 'start');
                let spliceTo = idx;
                if (preChildren.some((n) => n.type !== 'text' || n.value.length > 0)) {
                    parent.children.splice(spliceTo, 0, {
                        children: preChildren.filter((n) => n.type !== 'text' || n.value.length > 0),
                        type: 'paragraph'
                    });
                    spliceTo++;
                }
                parent.children.splice(spliceTo, 1, image);
                spliceTo++;
                if (postChildren.some((n) => n.type !== 'text' || n.value.length > 0)) {
                    parent.children.splice(spliceTo, 0, {
                        children: postChildren.filter((n) => n.type !== 'text' || n.value.length > 0),
                        type: 'paragraph'
                    });
                    spliceTo++;
                }
            }
        }
    });
};

interface Config {
    bibContent?: string;
    cleanAltText?: boolean;
    figure: (
        children: RootContent[] | PhrasingContent[],
        options: ParsedOptions
    ) => MdxJsxFlowElement | Parent;
    caption: (rawCaption: string, options: ParsedOptions) => MdxJsxTextElement | Parent;
    bib?: (imgSrc: string) => Promise<MdxJsxTextElement | undefined>;
    merge: (
        figure: MdxJsxFlowElement | Parent,
        caption: MdxJsxTextElement | Parent,
        bib?: MdxJsxTextElement
    ) => MdxJsxFlowElement | Parent;
}

export const transformer = (ast: Root, content: string, config: Config) => {
    unshiftImagesFromParagraphs(ast);
    const bibPromises = [] as Promise<any>[];
    visit(ast, 'image', (node, idx, parent) => {
        if (!parent) {
            return;
        }
        const line = (node.position?.start?.line || 1) - 1;
        const raw = content
            .split('\n')
            [line].slice((node.position?.start?.column || 1) - 1, node.position?.end?.column || 0);
        const rawCaption = raw.slice(2).replace(`](${node.url})`, '');
        /** get image options and set cleaned alt text */
        const cleanedAlt = cleanedText(rawCaption || '');
        const options = parseOptions(rawCaption || '', true);
        const className = (options as any).className as string | undefined;
        delete (options as any).className;
        const isInline = /@inline/.test(node.alt || '') && parent.type === 'paragraph';
        if (isInline) {
            node.alt = config.cleanAltText ? cleanedText(node.alt || '').replace(/@inline/, '') : node.alt;
            return SKIP;
        }
        node.alt = config.cleanAltText ? cleanedText(node.alt || '') : node.alt;
        const figure = config.figure([node], options);
        const caption = config.caption(cleanedAlt, options);
        if (!config.bib) {
            const imgNode = config.merge(figure, caption);
            parent.children.splice(idx || 0, 1, imgNode as any);
            return;
        }

        const promise = config.bib(node.url).then((bib) => {
            const imgNode = config.merge(figure, caption, bib);
            parent.children.splice(idx || 0, 1, imgNode as any);
        });
        bibPromises.push(promise);
    });
    return Promise.all(bibPromises);
};
