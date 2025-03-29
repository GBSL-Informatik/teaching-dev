import {
    $addUpdateTag,
    $createParagraphNode,
    $createTextNode,
    $getEditor,
    COMMAND_PRIORITY_EDITOR,
    KEY_DOWN_COMMAND,
    LexicalEditor,
    ParagraphNode
} from 'lexical';
import scheduleMicrotask from '@tdev-components/util/scheduleMicrotask';
let cleanupInsertedParagraph: (() => void) | null = null;
const lastKeys: [string, string] = ['null', 'null'];

export const registerKeydownHandler = (editor: LexicalEditor) => {
    return editor.registerCommand(
        KEY_DOWN_COMMAND,
        (event) => {
            lastKeys[0] = lastKeys[1];
            lastKeys[1] = event.key;
            if (cleanupInsertedParagraph && lastKeys[0] === lastKeys[1]) {
                cleanupInsertedParagraph();
            }
            cleanupInsertedParagraph = null;

            return false;
        },
        COMMAND_PRIORITY_EDITOR
    );
};

export const $insertPlaceholderParagraph = (insertP: (p: ParagraphNode) => void, withEmptyText = true) => {
    const editor = $getEditor();
    // console.log('edi', e, editor, e === editor);
    const newParagraph = $createParagraphNode();
    if (withEmptyText) {
        const text = $createTextNode('');
        newParagraph.append(text);
        insertP(newParagraph);
        text.select();
    } else {
        insertP(newParagraph);
        newParagraph.select();
    }
    cleanupInsertedParagraph = () => {
        scheduleMicrotask(() => {
            editor.update(() => {
                $addUpdateTag('skip-dom-selection');
                newParagraph.remove();
            });
        });
    };
};

export const cleanupPlaceholderParagraph = () => {
    console.log('keys', lastKeys);
    const isSameKey = lastKeys[0] === lastKeys[1];
    if (isSameKey && cleanupInsertedParagraph) {
        cleanupInsertedParagraph();
        cleanupInsertedParagraph = null;
    }
};
