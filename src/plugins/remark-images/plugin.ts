import { visit, SKIP } from 'unist-util-visit';
import type { Plugin, Processor, Transformer } from 'unified';
import type { MdxJsxFlowElement, MdxJsxTextElement } from 'mdast-util-mdx';
import { BlockContent, Content, Image, Paragraph, Parent } from 'mdast';
import path from 'path';
import fs from 'fs';
import { cleanedText, parseOptions, toJsxAttribute } from '../helpers';

const DEFAULT_TAG_NAMES = {
    figure: 'figure',
    figcaption: 'figcaption',
    sourceRef: 'SourceRef'
};

interface OptionsInput {
    tagNames?: {
        figure?: string;
        figcaption?: string;
        sourceRef?: string;
    };
    vFile?: {
        history: string[];
    };
}

const SPACER_SPAN = {
    type: 'mdxJsxFlowElement',
    name: 'span',
    attributes: [
        {
            type: 'mdxJsxAttribute',
            name: 'style',
            value: {
                type: 'mdxJsxAttributeValueExpression',
                value: '{flexGrow: 1}',
                data: {
                    estree: {
                        type: 'Program',
                        body: [
                            {
                                type: 'ExpressionStatement',
                                expression: {
                                    type: 'ObjectExpression',
                                    properties: [
                                        {
                                            type: 'Property',
                                            method: false,
                                            shorthand: false,
                                            computed: false,
                                            key: {
                                                type: 'Identifier',
                                                name: 'flexGrow'
                                            },
                                            value: {
                                                type: 'Literal',
                                                value: 1,
                                                raw: '1'
                                            },
                                            kind: 'init'
                                        }
                                    ]
                                }
                            }
                        ],
                        sourceType: 'module',
                        comments: []
                    }
                }
            }
        }
    ],
    children: [],
    data: {
        _mdxExplicitJsx: true
    }
} as MdxJsxFlowElement;

const plugin: Plugin = function plugin(
    this: Processor,
    optionsInput: OptionsInput = { tagNames: DEFAULT_TAG_NAMES }
): Transformer {
    return async (ast, vfile) => {
        const dir = path.dirname(vfile.history[0] || optionsInput?.vFile?.history[0] || '');
        const bibPromises = [] as Promise<any>[];
        visit(ast, (node, idx, parent: Parent) => {
            if (node.type === 'paragraph') {
                const paragraph = node as unknown as Paragraph;
                const imagesOnly = paragraph.children.every((n) => {
                    return n.type === 'image' || (n.type === 'text' && n.value.trim() === '');
                });
                if (imagesOnly) {
                    const imgs = paragraph.children.filter((n) => n.type === 'image') as Image[];
                    parent.children.splice(idx || 0, 1, ...imgs);
                    return [SKIP, idx];
                }
            }
            if (node.type === 'image') {
                const image = node as unknown as Image;
                /** get image options and set cleaned alt text */
                const cleanedAlt = cleanedText(image.alt || '');
                const options = parseOptions(image.alt || '', true);
                image.alt = cleanedAlt;
                const jsxType = parent.type === 'paragraph' ? 'mdxJsxTextElement' : 'mdxJsxFlowElement';
                const figure = {
                    type: jsxType,
                    name: optionsInput?.tagNames?.figure || DEFAULT_TAG_NAMES.figure,
                    attributes: Object.keys(options).length > 0 ? [toJsxAttribute('options', options)] : [],
                    children: [node as Content],
                    data: {
                        _mdxExplicitJsx: true
                    }
                } as MdxJsxFlowElement | MdxJsxTextElement;

                /**
                 * Add alt as caption
                 */
                const caption = {
                    type: jsxType,
                    name: optionsInput?.tagNames?.figcaption || DEFAULT_TAG_NAMES.figcaption,
                    attributes: [],
                    children: [],
                    data: {
                        _mdxExplicitJsx: true
                    }
                } as MdxJsxFlowElement | MdxJsxTextElement;

                if (cleanedAlt) {
                    const altAst = this.parse(cleanedAlt) as unknown as Parent;
                    const isWrappedByParagraph =
                        altAst.children?.length === 1 && altAst.children[0].type === 'paragraph';
                    const sanitized = isWrappedByParagraph ? (altAst.children[0] as Paragraph) : altAst;
                    (caption.children as Content[]).splice(
                        0,
                        0,
                        ...[SPACER_SPAN, ...sanitized.children, SPACER_SPAN]
                    );
                }

                /**
                 * Try to find a bib file with the same name as the image
                 */
                const ext = path.extname(image.url);
                const bibFile = path.resolve(dir, image.url.replace(new RegExp(`${ext}$`), '.json'));
                const hasBibFile = fs.existsSync(bibFile);
                if (hasBibFile) {
                    const bibPromise = import(bibFile)
                        .then(({ default: bib }) => {
                            const bibNode = {
                                type: jsxType,
                                name: optionsInput?.tagNames?.sourceRef || DEFAULT_TAG_NAMES.sourceRef,
                                attributes: [toJsxAttribute('bib', bib)],
                                children: [],
                                data: {
                                    _mdxExplicitJsx: true
                                }
                            } as MdxJsxFlowElement;
                            if (!cleanedAlt) {
                                caption.children.splice(caption.children.length, 0, SPACER_SPAN);
                            }
                            caption.children.splice(caption.children.length, 0, bibNode);
                        })
                        .catch((err) => {
                            console.warn('Invalid bib file', bibFile, err);
                        });
                    bibPromises.push(bibPromise);
                }
                if (caption.children.length > 0 || hasBibFile) {
                    figure.children.splice(figure.children.length, 0, caption as BlockContent);
                }
                parent.children.splice(idx || 0, 1, figure);
            }
        });
        await Promise.all(bibPromises);
        // console.log(JSON.stringify(ast, null, 2));
    };
};

export default plugin;
