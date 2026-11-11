import type { Node } from 'prosemirror-model';
import { type Command, EditorState, TextSelection } from 'prosemirror-state';
import { describe, expect, it } from 'vitest';
import { parseMarkdown } from '../../markdown';
import { schema } from '../../schema';
import { enterAtEndOfIsolatingNode, leaveIsolatingNode } from '../isolatingNodes';

/** the position at the end of the textblock containing `text` */
const endOf = (doc: Node, text: string) => {
    let found = -1;
    doc.descendants((node, pos) => {
        if (found < 0 && node.isTextblock && node.textContent.includes(text)) {
            found = pos + 1 + node.content.size;
        }
        return found < 0;
    });
    if (found < 0) {
        throw new Error(`"${text}" not found`);
    }
    return found;
};

/** appends an empty paragraph to the textblock's parent, as after pressing Enter at the end of `text` */
const withEmptyParagraphAfter = (doc: Node, text: string) => {
    const pos = endOf(doc, text) + 1;
    const newDoc = EditorState.create({ doc }).tr.insert(pos, schema.nodes.paragraph.create()).doc;
    return { doc: newDoc, cursor: pos + 1 };
};

/** the block structure of the document, e.g. `container_directive(paragraph) code_block` */
const structure = (node: Node): string => {
    const children: string[] = [];
    node.forEach((child) => {
        children.push(child.isTextblock ? child.type.name : structure(child));
    });
    return node.type === schema.nodes.doc ? children.join(' ') : `${node.type.name}(${children.join(' ')})`;
};

const run = (command: Command, doc: Node, cursor: number) => {
    let state = EditorState.create({ doc, selection: TextSelection.create(doc, cursor) });
    const handled = command(state, (tr) => {
        state = state.apply(tr);
    });
    const { $from } = state.selection;
    return {
        handled,
        structure: structure(state.doc),
        cursorDepth: $from.depth,
        cursorIn: $from.parent.type.name
    };
};

const ADMONITION = ':::note\nInside\n:::\n\n```py\nx = 1\n```\n';

describe('leaveIsolatingNode', () => {
    it('adds a paragraph after a directive followed by a code block', () => {
        const { doc } = parseMarkdown(ADMONITION);
        const result = run(leaveIsolatingNode, doc, endOf(doc, 'Inside'));
        expect(result.handled).toBe(true);
        expect(result.structure).toBe('container_directive(paragraph) paragraph code_block');
        expect(result.cursorDepth).toBe(1);
    });

    it('adds a paragraph after a jsx component inside a list item', () => {
        const { doc } = parseMarkdown('- Item\n\n  <Foo>\n    Inside\n  </Foo>\n\n  ```py\n  x = 1\n  ```\n');
        const result = run(leaveIsolatingNode, doc, endOf(doc, 'Inside'));
        expect(result.structure).toBe(
            'bullet_list(list_item(paragraph jsx_flow(paragraph) paragraph code_block))'
        );
        expect(result.cursorIn).toBe('paragraph');
    });

    it('moves an empty paragraph at the cursor after the directive', () => {
        const { doc, cursor } = withEmptyParagraphAfter(parseMarkdown(ADMONITION).doc, 'Inside');
        const result = run(leaveIsolatingNode, doc, cursor);
        expect(result.structure).toBe('container_directive(paragraph) paragraph code_block');
    });

    it('does nothing when the cursor is not at the end of the directive', () => {
        const { doc } = parseMarkdown(':::note\nFirst\n\nSecond\n:::\n');
        expect(run(leaveIsolatingNode, doc, endOf(doc, 'First')).handled).toBe(false);
    });

    it('leaves the splitting of cards to `splitDirectiveItem`', () => {
        const { doc } = parseMarkdown(':::cards\nFirst card\n:::\n');
        expect(run(leaveIsolatingNode, doc, endOf(doc, 'First card')).handled).toBe(false);
    });
});

describe('enterAtEndOfIsolatingNode', () => {
    it('moves an empty last paragraph after the directive', () => {
        const { doc, cursor } = withEmptyParagraphAfter(parseMarkdown(ADMONITION).doc, 'Inside');
        const result = run(enterAtEndOfIsolatingNode, doc, cursor);
        expect(result.structure).toBe('container_directive(paragraph) paragraph code_block');
        expect(result.cursorDepth).toBe(1);
    });

    it('leaves nested directives one at a time', () => {
        const source = '::::note\n:::tip\nInside\n:::\n::::\n';
        const { doc, cursor } = withEmptyParagraphAfter(parseMarkdown(source).doc, 'Inside');
        const result = run(enterAtEndOfIsolatingNode, doc, cursor);
        expect(result.structure).toBe('container_directive(container_directive(paragraph) paragraph)');
    });

    it('replaces an empty last card with a paragraph after the cards', () => {
        const { doc } = parseMarkdown(':::cards\nFirst card\n\n::br\nX\n:::\n');
        const state = EditorState.create({ doc });
        const emptyLastCard = state.tr.delete(endOf(doc, 'X') - 1, endOf(doc, 'X')).doc;
        const result = run(enterAtEndOfIsolatingNode, emptyLastCard, endOf(doc, 'X') - 1);
        expect(result.structure).toBe('items_directive(directive_item(paragraph)) paragraph');
    });

    it('does nothing in a non-empty paragraph', () => {
        const { doc } = parseMarkdown(ADMONITION);
        expect(run(enterAtEndOfIsolatingNode, doc, endOf(doc, 'Inside')).handled).toBe(false);
    });
});
