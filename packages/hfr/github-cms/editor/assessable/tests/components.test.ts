import type { Node } from 'prosemirror-model';
import { EditorState, TextSelection } from 'prosemirror-state';
import { describe, expect, it } from 'vitest';
import { insertBlock } from '../../commands';
import { parseMarkdown, serializeMarkdown } from '../../markdown';
import { createChoiceAnswer, createQuiz, createTrueFalseAnswer, isInQuestion, isInQuiz } from '../components';

const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/g;

/** the state with the cursor after the text */
const stateAt = (source: string, text: string) => {
    const { doc } = parseMarkdown(source);
    let pos = 0;
    doc.descendants((node, nodePos) => {
        if (node.isText && node.text === text) {
            pos = nodePos + text.length;
        }
    });
    return EditorState.create({ doc, selection: TextSelection.create(doc, pos) });
};

const serialized = (node: Node) => {
    let state = EditorState.create({ doc: parseMarkdown('\n').doc });
    insertBlock(node)(state, (tr) => (state = state.apply(tr)));
    return serializeMarkdown(state.doc, '\n').replace(UUID, '<uuid>');
};

const QUIZ =
    '<Quiz id="q">\n    <ChoiceAnswer correct={[1]}>\n        Frage\n    </ChoiceAnswer>\n\n    Text\n</Quiz>\n';

describe('isInQuiz', () => {
    it('is true anywhere inside a quiz', () => {
        expect(isInQuiz(stateAt(QUIZ, 'Text'))).toBe(true);
        expect(isInQuiz(stateAt(QUIZ, 'Frage'))).toBe(true);
        expect(isInQuiz(stateAt('Text\n', 'Text'))).toBe(false);
    });
});

describe('isInQuestion', () => {
    it('is true inside a question only', () => {
        expect(isInQuestion(stateAt(QUIZ, 'Frage'))).toBe(true);
        expect(isInQuestion(stateAt(QUIZ, 'Text'))).toBe(false);
    });
});

describe('created components', () => {
    it('gives standalone questions an id', () => {
        expect(serialized(createTrueFalseAnswer(false))).toMatchInlineSnapshot(`
          "<TrueFalseAnswer correct={true} id="<uuid>">
            Aussage
          </TrueFalseAnswer>
          "
        `);
        expect(serialized(createChoiceAnswer(false, true))).toMatchInlineSnapshot(`
          "<ChoiceAnswer correct={[1]} multiple id="<uuid>">
            Frage

            1. Antwort 1
            2. Antwort 2
            3. Antwort 3
          </ChoiceAnswer>
          "
        `);
    });

    it('creates a quiz with a question without id', () => {
        expect(serialized(createQuiz())).toMatchInlineSnapshot(`
          "<Quiz id="<uuid>">
            <ChoiceAnswer correct={[1]}>
              Frage

              1. Antwort 1
              2. Antwort 2
              3. Antwort 3
            </ChoiceAnswer>
          </Quiz>
          "
        `);
    });
});
