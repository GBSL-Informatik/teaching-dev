import type { Transformer } from 'unified';
import { Node, Parent } from 'unist';
import type { MdxJsxFlowElement } from 'mdast-util-mdx';
import { toJsxAttribute } from '../helpers';

const COMMENTABLE_BLOCK_TYPES = [
    'paragraph',
    'blockquote',
    'heading',
    'code',
    'thematicBreak',
    'html',
    'jsx',
    'listItem'
];
export interface PluginOptions {
    /**
     * Node types which should be commentable, in case they are a leaf node.
     * @default:
     * [    'paragraph',
            'blockquote',
            'heading',
            'code',
            'thematicBreak',
            'html',
            'jsx',
        ]
     */
    commentable?: string[];
    /**
     * JsxFlowElements which should be always be commentable, e.g. a <Figure/> Component.
     * The **name** of the JsxFlowElement is matched. In case of a match,
     * **no further child elements** will be visited.
     * @default: []
     */
    commentableJsxFlowElements?: string[];
    /**
     * JsxFlowElements which should **never** be commentable, e.g. the <Summary />.
     * The **name** of the JsxFlowElement is matched. In case of a match,
     * **no further child elements** will be visited.
     * @default: []
     */
    ignoreJsxFlowElements?: string[];
    /**
     * Some Codeblocks (`code`) should not be commentable, e.g. when they
     * render some sort of live code.
     * The Meta-String is everything that follows the language-name.
     * @example
     * ```py noComment
     * ```
     * --> the "noComment" is the meta String.
     *
     * @default ignore all codeblocks including a "noComment" meta string
     * /noComment/
     */
    ignoreCodeBlocksWithMeta?: RegExp;
}

/**
 * A remark plugin that adds a `<MdxComment /> elements after each block-element
 * This is useful to support comments within mdx documents.
 * A `page_id` in the frontmatter is required to generate the comments.
 */
const plugin = function plugin(options: PluginOptions): Transformer {
    return async (root, file) => {
        const { page_id } = (file.data?.frontMatter || {}) as { page_id?: string };
        if (!page_id) {
            return;
        }
        const { visit, SKIP } = await import('unist-util-visit');
        const commentableNodes = new Set(options?.commentable || COMMENTABLE_BLOCK_TYPES);
        const commentableJsxFlowElements = new Set(options?.commentableJsxFlowElements || []);
        const ignoredJsxFlowElements = new Set(options?.ignoreJsxFlowElements || []);
        const ignoreCodeBlocksWithMeta = options?.ignoreCodeBlocksWithMeta || /noComment/;
        let nodeNr = 0;
        const typeNrMap = new Map<string, number>();
        visit(root, (node, index, parent: Node | undefined) => {
            const idx = index as number;
            let addComment = false;
            if (node.type === 'code') {
                if (ignoreCodeBlocksWithMeta.test((node as { meta?: string }).meta || '')) {
                    return [SKIP];
                }
            }
            if (node.type === 'mdxJsxFlowElement' && (node as MdxJsxFlowElement).name) {
                if (ignoredJsxFlowElements.has((node as MdxJsxFlowElement).name!)) {
                    return [SKIP];
                }
                if (commentableJsxFlowElements.has((node as MdxJsxFlowElement).name!)) {
                    addComment = true;
                }
            }
            // Check if the node is block level
            if (commentableNodes.has(node.type)) {
                // Check if parent is defined and if it's not a block element adding current node
                if (parent && !commentableNodes.has(parent.type)) {
                    addComment = true;
                }
            }
            if (addComment) {
                nodeNr++;
                if (!typeNrMap.has(node.type)) {
                    typeNrMap.set(node.type, 0);
                }
                const typeNr = (typeNrMap.get(node.type) as number) + 1;
                typeNrMap.set(node.type, typeNr);
                const newNode: MdxJsxFlowElement = {
                    type: 'mdxJsxFlowElement',
                    name: 'MdxComment',
                    attributes: [
                        toJsxAttribute('nr', typeNr),
                        toJsxAttribute('nodeNr', nodeNr),
                        toJsxAttribute('type', node.type),
                        toJsxAttribute('pageId', page_id)
                    ],
                    children: [],
                    data: {}
                };
                (parent as Parent).children.splice(idx + 1, 0, newNode);
                return [SKIP];
            }
        });
    };
};

export default plugin;