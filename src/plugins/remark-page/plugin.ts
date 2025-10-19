import type { Plugin, Transformer } from 'unified';
import type { MdxJsxFlowElement } from 'mdast-util-mdx';
import type { Node, Root } from 'mdast';
import { toJsxAttribute } from '../helpers';
import path from 'path';
import { promises as fs } from 'fs';

export interface PluginOptions {
    extractors: { test: (node: Node) => boolean; getDocumentRootIds: (node: Node) => string[] }[];
    exportDir: string;
}

/**
 * A remark plugin that adds a `<MdxPage /> elements at the top of the current page.
 * This is useful to initialize a page model on page load and to trigger side-effects on page display,
 * as to load models attached to the `page_id`'s root document.
 */
const plugin: Plugin<PluginOptions[], Root> = function plugin(
    options = { extractors: [], exportDir: './.page-index' }
): Transformer<Root> {
    return async (root, file) => {
        const { visit, EXIT } = await import('unist-util-visit');
        const { page_id } = (file.data?.frontMatter || {}) as { page_id?: string };
        if (!page_id) {
            return;
        }
        const index: Set<string> = new Set();
        visit(root, (node, idx, parent) => {
            const extractor = options.extractors.find((ext) => ext.test(node));
            if (!extractor) {
                return;
            }
            const docRootIds = extractor.getDocumentRootIds(node);
            docRootIds.forEach((id) => index.add(id));
        });
        if (index.size > 0) {
            await fs.writeFile(
                path.join(options.exportDir, `${page_id}.json`),
                JSON.stringify([...index], null, 2),
                {
                    encoding: 'utf-8'
                }
            );
        }
        visit(root, (node, idx, parent) => {
            /** add the MdxPage exactly once at the top of the document and exit */
            if (root === node && !parent) {
                const loaderNode: MdxJsxFlowElement = {
                    type: 'mdxJsxFlowElement',
                    name: 'MdxPage',
                    attributes: [toJsxAttribute('pageId', page_id)],
                    children: [],
                    data: {}
                };
                node.children.splice(0, 0, loaderNode);
                return EXIT;
            }
        });
    };
};

export default plugin;
