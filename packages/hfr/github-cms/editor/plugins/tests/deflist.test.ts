import { EditorState, TextSelection } from 'prosemirror-state';
import { describe, expect, it } from 'vitest';
import { parseMarkdown } from '../../markdown';
import { decorationsOf, enterInDeflist, startDefinition } from '../deflist';

/** the decorated text of each class */
const decorated = (source: string) => {
    const { doc } = parseMarkdown(source);
    return decorationsOf(doc)
        .find()
        .map((decoration) => [
            decoration.spec.className,
            doc.textBetween(decoration.from, decoration.to, '|', '•')
        ]);
};

describe('deflist decorations', () => {
    it('marks terms and definitions', () => {
        expect(decorated('Hello World\n: The simplest example\nWorld\n: Our planet :mdi[earth]\n: Second\n'))
            .toMatchInlineSnapshot(`
              [
                [
                  "cms-deflist",
                  "Hello World
              : The simplest example
              World
              : Our planet •
              : Second",
                ],
                [
                  "cms-dt",
                  "Hello World",
                ],
                [
                  "cms-dd-marker",
                  ": ",
                ],
                [
                  "cms-dd",
                  "The simplest example",
                ],
                [
                  "cms-dt",
                  "World",
                ],
                [
                  "cms-dd-marker",
                  ": ",
                ],
                [
                  "cms-dd",
                  "Our planet •",
                ],
                [
                  "cms-dd-marker",
                  ": ",
                ],
                [
                  "cms-dd",
                  "Second",
                ],
              ]
            `);
    });

    it('ignores paragraphs without definitions', () => {
        expect(decorated('Just text\nwith a line break.\n\n: not a definition\n')).toEqual([]);
    });
});

describe('enter in a definition list', () => {
    /** a state with the cursor at the end of the first paragraph */
    const stateAtEnd = (source: string) => {
        const { doc } = parseMarkdown(source);
        return EditorState.create({
            doc,
            selection: TextSelection.create(doc, doc.firstChild!.nodeSize - 1)
        });
    };
    const pressEnter = (state: EditorState) => {
        let result = state;
        enterInDeflist(state, (tr) => (result = state.apply(tr)));
        return result;
    };
    const paragraphs = (state: EditorState) => {
        const texts: string[] = [];
        state.doc.forEach((node) => texts.push(node.textContent));
        return texts;
    };

    it('inserts a line break to add the next term', () => {
        const state = pressEnter(stateAtEnd('Term\n: Definition\n'));
        expect(paragraphs(state)).toEqual(['Term\n: Definition\n']);
    });

    it('starts a new paragraph when enter is pressed on an empty line', () => {
        const state = pressEnter(pressEnter(stateAtEnd('Term\n: Definition\n')));
        expect(paragraphs(state)).toEqual(['Term\n: Definition', '']);
    });

    it('moves the rest of the line to a new paragraph when enter is pressed at the start of a line', () => {
        const { doc } = parseMarkdown('Term\n: Definition\nNext\n');
        const lineStart = 1 + 'Term\n: Definition\n'.length;
        const state = EditorState.create({ doc, selection: TextSelection.create(doc, lineStart) });
        expect(paragraphs(pressEnter(state))).toEqual(['Term\n: Definition', 'Next']);
    });

    it('does nothing outside of definition lists', () => {
        expect(enterInDeflist(stateAtEnd('Just text\n'))).toBe(false);
    });
});

describe('typing `: ` after a line break', () => {
    /** the cursor is after the `:` at the end of the first paragraph, as when the space is typed */
    const typeSpace = (source: string) => {
        const { doc } = parseMarkdown(source);
        const end = doc.firstChild!.nodeSize - 1;
        const state = EditorState.create({ doc });
        const tr = startDefinition(state, end - 2, end);
        return tr && state.apply(tr).doc.firstChild!.textContent;
    };

    it('replaces the line break with a soft line break to start a definition', () => {
        expect(typeSpace('Term\\\n:\n')).toBe('Term\n: ');
    });

    it('needs a term before the line break', () => {
        expect(typeSpace('\\\n:\n')).toBeNull();
    });

    it('ignores colons without a line break before them', () => {
        expect(typeSpace('Term:\n')).toBeNull();
    });
});
