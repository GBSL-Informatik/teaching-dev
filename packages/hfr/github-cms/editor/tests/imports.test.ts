import { EditorState, TextSelection } from 'prosemirror-state';
import { describe, expect, it } from 'vitest';
import { insertBlock } from '../commands';
import { addImport, type ImportSpec, withImport } from '../imports';
import { parseMarkdown, serializeMarkdown } from '../markdown';
import { schema } from '../schema';

const BROWSER_WINDOW: ImportSpec = { name: 'BrowserWindow', source: '@tdev-components/BrowserWindow' };

const withBrowserWindowImport = (source: string) => {
    const { doc, trailing } = parseMarkdown(source);
    const state = EditorState.create({ doc });
    return serializeMarkdown(state.apply(addImport(state.tr, BROWSER_WINDOW)).doc, trailing);
};

describe('addImport', () => {
    it('creates an import block at the start of the document', () => {
        expect(withBrowserWindowImport('Text\n')).toMatchInlineSnapshot(`
          "import BrowserWindow from '@tdev-components/BrowserWindow';

          Text
          "
        `);
    });

    it('creates the import block after the frontmatter', () => {
        expect(withBrowserWindowImport('---\ntitle: Test\n---\n\nText\n')).toMatchInlineSnapshot(`
          "---
          title: Test
          ---

          import BrowserWindow from '@tdev-components/BrowserWindow';

          Text
          "
        `);
    });

    it('appends the import to the existing import block', () => {
        expect(withBrowserWindowImport("import Steps from '@tdev-components/Steps';\n\nText\n"))
            .toMatchInlineSnapshot(`
              "import Steps from '@tdev-components/Steps';
              import BrowserWindow from '@tdev-components/BrowserWindow';

              Text
              "
            `);
    });

    it('keeps an existing import of the name, even from another source', () => {
        const source = "import BrowserWindow from './MyWindow';\n\nText\n";
        expect(withBrowserWindowImport(source)).toBe(source);
    });

    it('recognizes named imports', () => {
        const source = "import { BrowserWindow } from './windows';\n\nText\n";
        expect(withBrowserWindowImport(source)).toBe(source);
    });
});

describe('withImport', () => {
    it('inserts the content and its import in a single transaction', () => {
        const { doc, trailing } = parseMarkdown('Text\n');
        let state = EditorState.create({ doc, selection: TextSelection.create(doc, 1) });
        const browserWindow = schema.nodes.jsx_flow_void.create({ name: 'BrowserWindow' });
        let transactionCount = 0;

        withImport(insertBlock(browserWindow), BROWSER_WINDOW)(state, (tr) => {
            transactionCount++;
            state = state.apply(tr);
        });

        expect(transactionCount).toBe(1);
        expect(state.selection.$from.parent.type.name).not.toBe('raw_block');
        expect(serializeMarkdown(state.doc, trailing)).toMatchInlineSnapshot(`
          "import BrowserWindow from '@tdev-components/BrowserWindow';

          Text

          <BrowserWindow />
          "
        `);
    });
});
