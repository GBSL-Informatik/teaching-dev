import type { Plugin, Transformer } from 'unified';
import type { Code, Root } from 'mdast';
import type { MdxJsxFlowElement, MdxJsxTextElement } from 'mdast-util-mdx';
import path from 'path';
import db from '../utils/db';
import { exportDB } from '../utils/exportDb';
import { debounce } from 'es-toolkit/function';
import { tdevRoot } from '../utils/options';
import { TypeModelMapping } from '@tdev-api/document';

const TdevRoot = `${tdevRoot === '' ? '' : '/'}${tdevRoot}`;
const TdevRootRegex = new RegExp(`^${TdevRoot}`);
const projectRoot = process.cwd();
const isDev = process.env.NODE_ENV !== 'production';

const insertDocRoot = db.prepare(
    `INSERT INTO document_roots (
        id, 
        type, 
        page_id,
        path,
        position
    ) VALUES (
        @id,
        @type,
        @page_id,
        @path,
        @position
    ) ON CONFLICT(id, path) DO NOTHING`
);

const cleanupPage = db.prepare(
    `DELETE FROM document_roots
     WHERE path = ? AND page_id = ?;`
);

interface JsxConfig {
    /**
     * Component Name
     */
    name: string;
    /**
     * @default id
     */
    attributeName?: string;
    docTypeExtractor: (node: MdxJsxFlowElement | MdxJsxTextElement) => keyof TypeModelMapping | string;
}

export interface PluginOptions {
    components: JsxConfig[];
    persistedCodeType?: (code: Code) => string;
}

const slugCountMap = new Map<string, number>();

const scheduleExportDb = debounce(
    async () => {
        await exportDB();
    },
    250,
    { edges: ['trailing'] }
);

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
        const { visit, CONTINUE } = await import('unist-util-visit');
        const filePath = `/${path.relative(projectRoot, file.path)}`
            .replace(/\/(index|README)\.mdx?$/i, '/')
            .replace(/\.mdx?$/i, '/')
            .replace(TdevRootRegex, '')
            .replace(/^\/versioned_docs\/version-/, '/')
            .replace(/\/\d+-(?=.)/g, '/'); // (?=.) is a lookahead to avoid replacing version numbers in the middle of the path)
        slugCountMap.set(filePath, 1);

        insertDocRoot.run({
            id: page_id,
            type: '<page>',
            page_id: page_id,
            path: filePath,
            position: 0
        });
        cleanupPage.run(filePath, page_id);
        visit(root, (node, index, parent) => {
            if (node.type === 'code') {
                const idMatch = /id=([a-zA-Z0-9-_]+)/.exec(node.meta || '');
                if (!idMatch) {
                    return CONTINUE;
                }
                const docId = idMatch[1];
                const docType = options.persistedCodeType?.(node) ?? 'code';
                const res = insertDocRoot.run({
                    id: docId,
                    type: docType,
                    page_id: page_id,
                    path: filePath,
                    position: slugCountMap.get(filePath)!
                });
                if (res.changes > 0) {
                    slugCountMap.set(filePath, slugCountMap.get(filePath)! + 1);
                }
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
            const res = insertDocRoot.run({
                id: docId,
                type: docType,
                page_id: page_id,
                path: filePath,
                position: slugCountMap.get(filePath)!
            });
            if (res.changes > 0) {
                slugCountMap.set(filePath, slugCountMap.get(filePath)! + 1);
            }
            return CONTINUE;
        });
        if (isDev) {
            scheduleExportDb();
        }
    };
};

export default remarkPlugin;
