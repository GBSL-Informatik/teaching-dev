import type { Node } from 'prosemirror-model';
import { describe, expect, it } from 'vitest';
import { parseMarkdown } from '..';

const DIRECTIVE_TYPES = ['leaf_directive', 'text_directive'];

const labelOf = (source: string) => {
    let label: string | undefined;
    parseMarkdown(source).doc.descendants((node: Node) => {
        if (label === undefined && DIRECTIVE_TYPES.includes(node.type.name)) {
            label = node.attrs.label;
        }
        return label === undefined;
    });
    return label;
};

describe('directive label', () => {
    it('keeps a url as written', () => {
        expect(labelOf('::youtube[https://www.youtube.com/embed/abc]\n')).toBe(
            'https://www.youtube.com/embed/abc'
        );
    });

    it('keeps the markdown of the label as written', () => {
        expect(labelOf('Text :abbr[__HTML__ \\]]{title="x"}\n')).toBe('__HTML__ \\]');
    });

    it('is empty without label', () => {
        expect(labelOf('::youtube{#abc}\n')).toBe('');
    });
});
