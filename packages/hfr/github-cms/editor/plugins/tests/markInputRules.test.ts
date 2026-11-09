import { inputRules } from 'prosemirror-inputrules';
import { EditorState, TextSelection } from 'prosemirror-state';
import type { EditorView } from 'prosemirror-view';
import { describe, expect, it } from 'vitest';
import { serializeMarkdown } from '../../markdown';
import { schema } from '../../schema';
import { markInputRules } from '../markInputRules';

const plugin = inputRules({ rules: markInputRules });

/** types the text character by character into an empty paragraph and returns the resulting markdown */
const type = (text: string): string => {
    const doc = schema.nodes.doc.create(null, schema.nodes.paragraph.create());
    let state = EditorState.create({ doc, plugins: [plugin], selection: TextSelection.create(doc, 1) });
    const view = {
        get state() {
            return state;
        },
        composing: false,
        dispatch: (tr) => {
            state = state.apply(tr);
        }
    } as Pick<EditorView, 'state' | 'composing' | 'dispatch'> as EditorView;

    for (const char of text) {
        const { from, to } = state.selection;
        const isHandled = plugin.props.handleTextInput!.call(plugin, view, from, to, char, () => state.tr);
        if (!isHandled) {
            view.dispatch(state.tr.insertText(char));
        }
    }
    return serializeMarkdown(state.doc, '');
};

describe('mark input rules', () => {
    it('applies the marks of the typed markdown', () => {
        expect(type('This is *italic*, `code`, **bold**, __boxed__ text.')).toBe(
            'This is *italic*, `code`, **bold**, __boxed__ text.'
        );
    });

    it('applies strikethrough, underscore emphasis and kbd', () => {
        expect(type('~~gone~~ _em_ [[Ctrl]]')).toBe('~~gone~~ *em* [[Ctrl]]');
    });

    it('does not continue the mark after the closing delimiter', () => {
        expect(type('*a* b')).toBe('*a* b');
    });

    it('ignores delimiters inside words and around whitespace', () => {
        expect(type('snake_case_name')).toBe('snake_case_name');
        expect(type('a * b *')).toBe('a \\* b \\*');
    });

    it('does not apply marks while typing inline code', () => {
        expect(type('`a *b* c`')).toBe('`a *b* c`');
    });
});
