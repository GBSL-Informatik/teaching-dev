import { baseKeymap } from 'prosemirror-commands';
import type { Node } from 'prosemirror-model';
import { EditorState, TextSelection } from 'prosemirror-state';
import { describe, expect, it } from 'vitest';
import { withoutSpacesAtCursor } from '../commands';
import { parseMarkdown, serializeMarkdown } from '../markdown';

const enter = withoutSpacesAtCursor(baseKeymap.Enter);

/** presses Enter after the first occurrence of `before` */
const pressEnterAfter = (source: string, before: string) => {
    const { doc } = parseMarkdown(source);
    let cursor = -1;
    doc.descendants((node: Node, pos) => {
        if (cursor < 0 && node.isTextblock && node.textContent.includes(before)) {
            cursor = pos + 1 + node.textContent.indexOf(before) + before.length;
        }
        return cursor < 0;
    });
    let state = EditorState.create({ doc, selection: TextSelection.create(doc, cursor) });
    enter(state, (tr) => {
        state = state.apply(tr);
    });
    return { markdown: serializeMarkdown(state.doc), cursorText: state.selection.$from.parent.textContent };
};

describe('withoutSpacesAtCursor', () => {
    it('removes the spaces at the cursor when splitting a paragraph', () => {
        const result = pressEnterAfter('First second\n', 'First ');
        expect(result.markdown).toBe('First\n\nsecond\n');
        expect(result.cursorText).toBe('second');
    });

    it('splits as usual without spaces at the cursor', () => {
        expect(pressEnterAfter('Firstsecond\n', 'First').markdown).toBe('First\n\nsecond\n');
    });

    it('keeps the spaces when the command is not applicable', () => {
        const { doc } = parseMarkdown('Text  here\n');
        const state = EditorState.create({ doc, selection: TextSelection.create(doc, 6) });
        expect(withoutSpacesAtCursor(() => false)(state, () => undefined)).toBe(false);
    });
});
