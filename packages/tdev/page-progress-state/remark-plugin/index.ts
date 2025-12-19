import type { Plugin, Transformer } from 'unified';
import type { Node, Root } from 'mdast';
import path from 'path';
import { promises as fs, accessSync, mkdirSync, writeFileSync, readFileSync } from 'fs';

export interface PluginOptions {
    extractors: { test: (node: Node) => boolean; getDocumentRootIds: (node: Node) => string[] }[];
}

const projectRoot = process.cwd();

/**
 *
 * sidebar:
 * {
 *    "1f6db0ee-aa48-44c7-af43-4b66843f665e": [ ... document root ids ]
 * }
 *
 * structure:
 * {
 *    "path" : {
 *      "to": {
 *         "doc":
 *       },
 *    }
 * }
 */

const ensureFile = async (indexPath: string) => {
    const assetsDir = path.dirname(indexPath);
    try {
        accessSync(assetsDir);
    } catch {
        mkdirSync(assetsDir, { recursive: true });
    }
    try {
        accessSync(indexPath);
    } catch {
        writeFileSync(indexPath, JSON.stringify({}, null, 2), {
            encoding: 'utf-8'
        });
    }
};

/**
 * A remark plugin that adds a `<MdxPage /> elements at the top of the current page.
 * This is useful to initialize a page model on page load and to trigger side-effects on page display,
 * as to load models attached to the `page_id`'s root document.
 */
const remarkPlugin: Plugin<PluginOptions[], Root> = function plugin(
    options = { extractors: [] }
): Transformer<Root> {
    const index = new Map<string, string[]>();
    const structurePath = path.resolve(__dirname, '../assets/', 'structure.json');
    const indexPath = path.resolve(__dirname, '../assets/', 'index.json');
    ensureFile(indexPath);
    ensureFile(structurePath);
    try {
        const content = readFileSync(indexPath, { encoding: 'utf-8' });
        const parsed = JSON.parse(content) as { [key: string]: string[] };
        for (const [key, values] of Object.entries(parsed)) {
            index.set(key, values);
        }
    } catch {
        console.log('Error parsing existing index file, starting fresh.');
    }

    return async (root, file) => {
        const { visit, EXIT } = await import('unist-util-visit');
        const { page_id } = (file.data?.frontMatter || {}) as { page_id?: string };
        if (!page_id) {
            return;
        }
        const filePath = path
            .relative(projectRoot, file.path)
            .replace(/\/(index|README)\.mdx?$/i, '')
            .replace(/\.mdx?$/i, '');
        console.log('file', filePath);
        const pageIndex = new Set<string>([]);
        visit(root, (node, idx, parent) => {
            const extractor = options.extractors.find((ext) => ext.test(node));
            if (!extractor) {
                return;
            }
            const docRootIds = extractor.getDocumentRootIds(node);
            docRootIds.forEach((id) => pageIndex.add(id));
        });
        index.set(page_id, [...pageIndex]);
        await fs.writeFile(indexPath, JSON.stringify(Object.fromEntries(index), null, 2), {
            encoding: 'utf-8'
        });
    };
};

export default remarkPlugin;
