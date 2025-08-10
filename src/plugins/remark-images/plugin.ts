import type { Plugin, Transformer } from 'unified';
import type { MdxJsxAttribute, MdxJsxFlowElement, MdxJsxTextElement } from 'mdast-util-mdx';
import { Image, Parent, PhrasingContent, Root } from 'mdast';
import path from 'path';
import { promises as fs } from 'fs';
import { toJsxAttribute } from '../helpers';
import clsx from 'clsx';
import { transformer } from './transformer';

const DEFAULT_TAG_NAMES = {
    figure: 'span',
    figcaption: 'span',
    sourceRef: 'SourceRef'
};

const STATIC_DIR = '/static' as const;

export type CaptionVisitor = (captionAst: Parent, rawCaption: string) => void;

interface OptionsInput {
    tagNames?: {
        figure?: string;
        figcaption?: string;
        sourceRef?: string;
    };
    inlineEmptyCaptions?: boolean;
    captionVisitors?: CaptionVisitor[];
    srcAttr?: string;
}

const SPACER_SPAN = {
    type: 'mdxJsxTextElement',
    name: 'span',
    attributes: [toJsxAttribute('style', { flexGrow: 1 })],
    children: []
} as MdxJsxTextElement;
const BUILD_LOCATION = process.cwd();

const plugin: Plugin<OptionsInput[], Root> = function plugin(
    this,
    optionsInput = { tagNames: DEFAULT_TAG_NAMES }
): Transformer<Root> {
    return async (ast, vfile) => {
        const dir = path.dirname(vfile.history[0] || '');
        await transformer(ast, vfile.value.toString(), {
            cleanAltText: true,
            bib: async (imgSrc) => {
                const ext = path.extname(imgSrc);
                const bibFile = path.resolve(dir, imgSrc.replace(new RegExp(`${ext}$`), '.json'));
                const hasBibFile = await fs
                    .stat(bibFile)
                    .then(() => true)
                    .catch(() => false);
                if (hasBibFile) {
                    const bibContent = await import(bibFile)
                        .then(({ default: bib }) => bib)
                        .catch((err) => {
                            console.warn('Invalid bib file', bibFile, err);
                        });
                    if (!bibContent) {
                        return;
                    }
                    const bibNode = {
                        type: 'mdxJsxTextElement',
                        name: optionsInput?.tagNames?.sourceRef || DEFAULT_TAG_NAMES.sourceRef,
                        attributes: [toJsxAttribute('bib', bibContent)],
                        children: []
                    } as MdxJsxTextElement;
                    return bibNode;
                }
            },
            caption: (rawCaption, options) => {
                const { inlineCaption = false } = options;
                const { inlineEmptyCaptions = true } = optionsInput;
                const captionEmpty = /^\s*$/.test(rawCaption);
                /**
                 * Add alt as caption
                 */
                const caption = {
                    type: 'mdxJsxTextElement',
                    name: optionsInput?.tagNames?.figcaption || DEFAULT_TAG_NAMES.figcaption,
                    attributes: [
                        toJsxAttribute(
                            'className',
                            clsx(
                                'caption',
                                (inlineCaption || (captionEmpty && inlineEmptyCaptions)) && 'inline'
                            )
                        )
                    ],
                    children: []
                } as MdxJsxTextElement;

                if (rawCaption) {
                    const altAst = this.parse(rawCaption) as Parent;
                    if (optionsInput?.captionVisitors) {
                        optionsInput.captionVisitors.forEach((visitor) => visitor(altAst, rawCaption));
                    }
                    /* flatten paragraphs by only using their child nodes */
                    const altNodes = altAst.children.flatMap((n) =>
                        n.type === 'paragraph' ? n.children : (n as PhrasingContent)
                    );
                    caption.children = [SPACER_SPAN, ...altNodes, SPACER_SPAN];
                }
                return caption;
            },
            figure: (children, options) => {
                const srcAttr: MdxJsxAttribute[] = [];
                if (process.env.NODE_ENV !== 'production' && optionsInput?.srcAttr) {
                    const src = (children[0] as Image)?.url;
                    try {
                        new URL(src); // ensure the src has no protocol
                    } catch (err) {
                        const fSrc = src.startsWith('/')
                            ? path.join(STATIC_DIR, src)
                            : path.resolve(dir, src).replace(BUILD_LOCATION, '');
                        srcAttr.push(toJsxAttribute(optionsInput.srcAttr, fSrc));
                    }
                }
                return {
                    type: 'mdxJsxFlowElement',
                    name: optionsInput?.tagNames?.figure || DEFAULT_TAG_NAMES.figure,
                    attributes: [
                        toJsxAttribute('className', clsx('figure', options.className)),
                        ...(Object.keys(options).length > 0 ? [toJsxAttribute('options', options)] : []),
                        ...srcAttr
                    ],
                    children: children
                } as MdxJsxFlowElement;
            },
            merge: (figure, caption, bib) => {
                if (bib) {
                    if (caption.children.length === 0) {
                        caption.children.splice(caption.children.length, 0, SPACER_SPAN);
                    }
                    caption.children.splice(caption.children.length, 0, bib);
                }
                if (caption.children.length > 0) {
                    figure.children.splice(figure.children.length, 0, caption as any);
                }
                return figure;
            }
        });
    };
};

export default plugin;
