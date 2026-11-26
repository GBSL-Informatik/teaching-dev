import type { Node } from 'prosemirror-model';
import { Plugin } from 'prosemirror-state';
import { Decoration, DecorationSet, type EditorView } from 'prosemirror-view';
import { correctOptions, optionList, withCorrectOption } from '../assessable/choiceAnswer';
import { isChoiceAnswer } from '../assessable/components';

/** marks the option of the `<ChoiceAnswer>` at `pos` as correct or not */
const setCorrect = (view: EditorView, pos: number, option: number, isCorrect: boolean) => {
    const choiceAnswer = view.state.doc.nodeAt(pos);
    const correct =
        choiceAnswer && isChoiceAnswer(choiceAnswer) && correctOptions(choiceAnswer.attrs.attributes);
    if (!correct) {
        return;
    }
    const attributes = withCorrectOption(correct, choiceAnswer.attrs.attributes, option, isCorrect);
    view.dispatch(view.state.tr.setNodeMarkup(pos, undefined, { ...choiceAnswer.attrs, attributes }));
};

const createCheckbox = (isCorrect: boolean, onChange: (isCorrect: boolean) => void) => {
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = isCorrect;
    checkbox.className = 'cms-choice-checkbox';
    checkbox.title = isCorrect ? 'Richtige Antwort' : 'Falsche Antwort';
    checkbox.contentEditable = 'false';
    // keep the focus (and selection) where it is
    checkbox.addEventListener('mousedown', (event) => event.preventDefault());
    checkbox.addEventListener('change', () => onChange(checkbox.checked));
    return checkbox;
};

/** a checkbox at the start of each option, the first text of the option when it has one */
const optionDecorations = (choiceAnswer: Node, pos: number): Decoration[] => {
    const correct = correctOptions(choiceAnswer.attrs.attributes);
    const options = optionList(choiceAnswer);
    if (!correct || !options) {
        return [];
    }
    const listPos = pos + 1 + options.offset;
    const decorations: Decoration[] = [];
    options.list.forEach((item, offset, index) => {
        const option = index + 1;
        const isCorrect = correct.includes(option);
        const itemPos = listPos + 1 + offset;
        const checkboxPos = item.firstChild?.isTextblock ? itemPos + 2 : itemPos + 1;
        const checkbox = (view: EditorView) =>
            createCheckbox(isCorrect, (checked) => setCorrect(view, pos, option, checked));
        decorations.push(
            Decoration.node(itemPos, itemPos + item.nodeSize, {
                class: isCorrect ? 'cms-choice-option cms-choice-option--correct' : 'cms-choice-option'
            }),
            Decoration.widget(checkboxPos, checkbox, {
                side: -1,
                ignoreSelection: true,
                stopEvent: () => true,
                // recreated when the answer changes, the checkbox is not updated
                key: `choice-${checkboxPos}-${isCorrect}`
            })
        );
    });
    return decorations;
};

const choiceDecorations = (doc: Node) => {
    const decorations: Decoration[] = [];
    doc.descendants((node, pos) => {
        if (isChoiceAnswer(node)) {
            decorations.push(...optionDecorations(node, pos));
        }
        return !node.type.spec.code;
    });
    return DecorationSet.create(doc, decorations);
};

/**
 * Each option of a `<ChoiceAnswer>` gets a checkbox, ticking it marks the option as correct.
 */
export const choiceOptions = () =>
    new Plugin<DecorationSet>({
        state: {
            init: (_, state) => choiceDecorations(state.doc),
            apply: (tr, decorations) => (tr.docChanged ? choiceDecorations(tr.doc) : decorations)
        },
        props: {
            decorations(state) {
                return this.getState(state);
            }
        }
    });
