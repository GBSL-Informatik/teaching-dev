import { EditorState, TextSelection, type Transaction } from 'prosemirror-state';
import { describe, expect, it } from 'vitest';
import { parseMarkdown, serializeMarkdown } from '../../markdown';
import { questionIds } from '../questionIds';

const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/g;

const SOURCE = `<Quiz id="quiz">
    <ChoiceAnswer correct={[1]}>
        Frage im Quiz
    </ChoiceAnswer>
</Quiz>

<TrueFalseAnswer correct={true}>
    Verschobene Frage
</TrueFalseAnswer>

<TrueFalseAnswer correct={false} id="kept">
    Frage mit id
</TrueFalseAnswer>
`;

/** applies a text insertion, marked as the ui event, with the plugin */
const applyEdit = (uiEvent?: string) => {
    const { doc, trailing } = parseMarkdown(SOURCE);
    const state = EditorState.create({ doc, plugins: [questionIds()] });
    const tr: Transaction = state.tr.insertText('!', 1);
    if (uiEvent) {
        tr.setMeta('uiEvent', uiEvent);
    }
    const { state: updated } = state.applyTransaction(tr.setSelection(TextSelection.create(tr.doc, 1)));
    return serializeMarkdown(updated.doc, trailing).replace(UUID, '<uuid>');
};

describe('questionIds', () => {
    it('adds an id to questions outside of a quiz after a drop', () => {
        expect(applyEdit('drop')).toMatchInlineSnapshot(`
          "<Quiz id="quiz">
              !

              <ChoiceAnswer correct={[1]}>
                  Frage im Quiz
              </ChoiceAnswer>
          </Quiz>

          <TrueFalseAnswer correct={true} id="<uuid>">
              Verschobene Frage
          </TrueFalseAnswer>

          <TrueFalseAnswer correct={false} id="kept">
              Frage mit id
          </TrueFalseAnswer>
          "
        `);
    });

    it('adds an id after a paste', () => {
        expect(applyEdit('paste')).toContain('<TrueFalseAnswer correct={true} id="<uuid>">');
    });

    it('does not change questions on other edits', () => {
        expect(applyEdit()).not.toContain('<uuid>');
    });
});
