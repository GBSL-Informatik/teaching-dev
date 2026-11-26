import { Plugin, type Transaction } from 'prosemirror-state';
import { standaloneQuestionsWithoutId } from '../assessable/components';
import { idAttribute } from '../uuid';

/** set by ProseMirror on transactions moving content, see `EditorView.dispatchEvent` */
const isDropOrPaste = (tr: Transaction) => {
    const uiEvent = tr.getMeta('uiEvent');
    return tr.docChanged && (uiEvent === 'drop' || uiEvent === 'paste');
};

/**
 * A question moved out of a `<Quiz>` gets a new `id`: only the questions of a quiz are
 * stored in the document of the quiz. The id is undone together with the move, see prosemirror-history.
 * Other edits do not add ids, so opening a file never changes questions elsewhere in it.
 */
export const questionIds = () =>
    new Plugin({
        appendTransaction: (transactions, _oldState, state) => {
            if (!transactions.some(isDropOrPaste)) {
                return null;
            }
            const positions = standaloneQuestionsWithoutId(state.doc);
            if (positions.length === 0) {
                return null;
            }
            const tr = state.tr;
            for (const pos of positions) {
                const question = tr.doc.nodeAt(pos)!;
                const attributes = [...question.attrs.attributes, idAttribute()];
                tr.setNodeMarkup(pos, undefined, { ...question.attrs, attributes });
            }
            return tr;
        }
    });
