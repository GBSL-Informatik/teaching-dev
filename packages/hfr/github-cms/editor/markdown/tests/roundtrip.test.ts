import { globSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { Node } from 'prosemirror-model';
import { describe, expect, it } from 'vitest';
import { schema } from '../../schema';
import { parseMarkdown, serializeMarkdown } from '..';

/**
 * Uses all markdown files of this repository as test corpus.
 */
const REPO_ROOT = path.resolve(__dirname, '../../../../../..');
const FILES = globSync('{docs,blog,tdev-website/docs,packages}/**/*.{md,mdx}', {
    cwd: REPO_ROOT,
    exclude: (file) => file.includes('node_modules')
});

const read = (file: string) => readFileSync(path.join(REPO_ROOT, file), 'utf8');

/**
 * Removes the source formatting hints and the whitespace of jsx expressions,
 * which both do not change the meaning of the document.
 */
const normalized = (json: unknown): unknown => {
    if (Array.isArray(json)) {
        return json.map(normalized);
    }
    if (json && typeof json === 'object') {
        return Object.fromEntries(
            Object.entries(json)
                .filter(([key]) => key !== 'format')
                .map(([key, value]) => [key, normalized(value)])
        );
    }
    if (typeof json === 'string') {
        return json.replace(/\n\s+/g, '\n');
    }
    return json;
};

describe('round trip of the repository markdown files', () => {
    it('finds markdown files', () => {
        expect(FILES.length).toBeGreaterThan(50);
    });

    it.each(FILES)('keeps %s unchanged when nothing is edited', (file) => {
        const source = read(file);
        const { doc, trailing } = parseMarkdown(source);
        expect(serializeMarkdown(doc, trailing)).toBe(source);
    });

    it.each(FILES)('serializes %s without original sources to equivalent markdown', (file) => {
        const { doc, trailing } = parseMarkdown(read(file));
        const withoutOrigins = Node.fromJSON(schema, normalized(doc.toJSON()));
        const regenerated = serializeMarkdown(withoutOrigins, trailing);
        const reparsed = parseMarkdown(regenerated).doc;
        expect(normalized(reparsed.toJSON())).toEqual(normalized(doc.toJSON()));
    });
});
