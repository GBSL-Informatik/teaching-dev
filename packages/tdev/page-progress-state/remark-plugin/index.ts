import type { Plugin, Transformer } from 'unified';
import type { Code, Root } from 'mdast';
import type { MdxJsxFlowElement, MdxJsxTextElement } from 'mdast-util-mdx';
import path from 'path';
import Database from 'better-sqlite3';
import { accessSync, mkdirSync } from 'fs';

const projectRoot = process.cwd();
const dbPath = path.join(projectRoot, '.docusaurus', 'tdev-gather-document-roots', 'docs-pages.db');

try {
    accessSync(path.dirname(dbPath));
} catch {
    mkdirSync(path.dirname(dbPath), { recursive: true });
}
const db = new Database(dbPath, { fileMustExist: false });
db.pragma('journal_mode = WAL');

const createPages = db.prepare(
    'CREATE TABLE IF NOT EXISTS pages (id TEXT NOT NULL, path TEXT NOT NULL, UNIQUE(id, path))'
);
const createDocRoots = db.prepare(
    'CREATE TABLE IF NOT EXISTS document_roots (id TEXT PRIMARY KEY, type TEXT NOT NULL, page_id TEXT NOT NULL, position INTEGER NOT NULL)'
);
createPages.run();
createDocRoots.run();

const insertPage = db.prepare(
    'INSERT INTO pages (id, path) VALUES (@id, @path) ON CONFLICT(id, path) DO NOTHING'
);
const insertDocRoot = db.prepare(
    'INSERT INTO document_roots (id, type, page_id, position) VALUES (@id, @type, @page_id, @position) ON CONFLICT(id) DO UPDATE SET type=excluded.type, page_id=excluded.page_id, position=excluded.position'
);

interface JsxConfig<T extends MdxJsxFlowElement | MdxJsxTextElement = MdxJsxFlowElement | MdxJsxTextElement> {
    /**
     * Component Name
     */
    name: string;
    /**
     * @default id
     */
    attributeName?: string;
    docTypeExtractor: (node: T) => string;
}

export interface PluginOptions {
    components: JsxConfig[];
    persistedCodeType?: (code: Code) => string;
}

/**
 * This plugin transforms inline code and code blocks in MDX files to use
 * custom MDX components by converting the code content into attributes.
 */
const remarkPlugin: Plugin<PluginOptions[], Root> = function plugin(
    options = { components: [], persistedCodeType: () => 'code' }
): Transformer<Root> {
    const { components } = options;
    const mdxJsxComponents = new Map<string, JsxConfig>(components.map((c) => [c.name, c]));
    return async (root, file) => {
        const { page_id } = (file.data?.frontMatter || {}) as { page_id?: string };
        if (components.length < 1 || !page_id) {
            return;
        }
        const { visit, SKIP, CONTINUE } = await import('unist-util-visit');
        console.log(
            `                                                    Processing persistable documents for page_id=${page_id}`
        );
        const filePath = path
            .relative(projectRoot, file.path)
            .replace(/\/(index|README)\.mdx?$/i, '')
            .replace(/\.mdx?$/i, '');
        insertPage.run({ id: page_id, path: filePath });
        let pagePosition = 0;
        visit(root, (node, index, parent) => {
            if (node.type === 'code') {
                const idMatch = /id=([a-zA-Z0-9-_]+)/.exec(node.meta || '');
                if (!idMatch) {
                    return CONTINUE;
                }
                const docId = idMatch[1];
                const docType = options.persistedCodeType?.(node) ?? 'code';
                insertDocRoot.run({
                    id: docId,
                    type: docType,
                    page_id: page_id,
                    position: pagePosition
                });
                pagePosition = pagePosition + 1;
                return CONTINUE;
            }
            if (
                (node.type !== 'mdxJsxFlowElement' && node.type !== 'mdxJsxTextElement') ||
                !mdxJsxComponents.has(node.name as string)
            ) {
                return CONTINUE;
            }
            const config = mdxJsxComponents.get(node.name!)!;
            const attr = node.attributes.find(
                (a) => a.type === 'mdxJsxAttribute' && a.name === (config.attributeName || 'id')
            );
            if (!attr || attr.type !== 'mdxJsxAttribute' || typeof attr.value !== 'string') {
                return CONTINUE;
            }
            const docId = attr.value;
            const docType = config.docTypeExtractor(node);
            insertDocRoot.run({ id: docId, type: docType, page_id: page_id, position: pagePosition });
            pagePosition = pagePosition + 1;
            return CONTINUE;
        });
    };
};

export default remarkPlugin;
