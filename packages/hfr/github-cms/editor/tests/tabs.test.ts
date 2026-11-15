import { EditorState, TextSelection } from 'prosemirror-state';
import { describe, expect, it } from 'vitest';
import { parseMarkdown, serializeMarkdown } from '../markdown';
import { insertTabItem } from '../tabs';

const TABS = `<Tabs>
  <TabItem value="a" label="A">
    First
  </TabItem>
  <TabItem value="b" label="B">
    Second
  </TabItem>
</Tabs>
`;

/** inserts a tab item with the cursor in the first textblock containing `text` */
const insertTabItemAt = (source: string, text: string) => {
    const { doc, trailing } = parseMarkdown(source);
    let cursor = -1;
    doc.descendants((node, pos) => {
        if (cursor < 0 && node.isTextblock && node.textContent.includes(text)) {
            cursor = pos + 1;
        }
        return cursor < 0;
    });
    let state = EditorState.create({ doc, selection: TextSelection.create(doc, cursor) });
    const isInserted = insertTabItem(state, (tr) => {
        state = state.apply(tr);
    });
    return {
        isInserted,
        markdown: serializeMarkdown(state.doc, trailing),
        cursorText: state.selection.$from.parent.textContent
    };
};

describe('insertTabItem', () => {
    it('inserts the tab item after the tab item at the cursor', () => {
        const { markdown, cursorText } = insertTabItemAt(TABS, 'First');
        expect(markdown).toBe(`<Tabs>
  <TabItem value="a" label="A">
    First
  </TabItem>

  <TabItem value="tab3" label="Tab 3">
    Inhalt
  </TabItem>

  <TabItem value="b" label="B">
    Second
  </TabItem>
</Tabs>
`);
        expect(cursorText).toBe('Inhalt');
    });

    it('inserts the tab item after the block at the cursor directly inside the tabs', () => {
        const source =
            '<Tabs>\n  Intro\n\n  <TabItem value="tab1" label="Tab 1">\n    First\n  </TabItem>\n</Tabs>\n';
        expect(insertTabItemAt(source, 'Intro').markdown).toContain(
            '  Intro\n\n  <TabItem value="tab2" label="Tab 2">\n    Inhalt\n  </TabItem>\n\n  <TabItem value="tab1"'
        );
    });

    it('uses a value not taken by the other tab items', () => {
        const source = '<Tabs>\n  <TabItem value="tab2" label="Tab 2">\n    First\n  </TabItem>\n</Tabs>\n';
        expect(insertTabItemAt(source, 'First').markdown).toContain('<TabItem value="tab3" label="Tab 3">');
    });

    it('is not available outside of tabs', () => {
        expect(insertTabItemAt('Text\n', 'Text').isInserted).toBe(false);
    });
});
