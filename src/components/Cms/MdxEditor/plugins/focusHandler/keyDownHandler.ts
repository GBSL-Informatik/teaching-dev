import {
    $addUpdateTag,
    $createParagraphNode,
    $createTextNode,
    $getEditor,
    COMMAND_PRIORITY_EDITOR,
    KEY_DOWN_COMMAND,
    LexicalEditor,
    ParagraphNode,
    TextNode
} from 'lexical';
import scheduleMicrotask from '@tdev-components/util/scheduleMicrotask';
let cleanupInsertedParagraph: (() => void) | null = null;
const lastKeys: [string, string] = ['null', 'null'];
const OPPOSITE = {
    ArrowDown: 'ArrowUp',
    ArrowUp: 'ArrowDown',
    ArrowRight: 'ArrowLeft',
    ArrowLeft: 'ArrowRight'
};
const isSameKey = () => {
    return lastKeys[0] === lastKeys[1] || lastKeys[0] === OPPOSITE[lastKeys[1] as keyof typeof OPPOSITE];
};

export const registerKeydownHandler = (editor: LexicalEditor) => {
    return editor.registerCommand(
        KEY_DOWN_COMMAND,
        (event) => {
            lastKeys[0] = lastKeys[1];
            lastKeys[1] = event.key;
            if (cleanupInsertedParagraph && isSameKey()) {
                const cleaner = cleanupInsertedParagraph;
                setTimeout(() => {
                    cleaner();
                }, 5);
            }
            cleanupInsertedParagraph = null;

            return false;
        },
        COMMAND_PRIORITY_EDITOR
    );
};

export const $insertPlaceholderParagraph = (insertP: (p: ParagraphNode) => void, withEmptyText = true) => {
    const editor = $getEditor();
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
export const $insertPlaceholderText = (insertT: (p: TextNode) => void, select: 'start' | 'end') => {
    const editor = $getEditor();
    const newText = $createTextNode(' ');
    insertT(newText);
    if (select === 'start') {
        newText.selectStart();
    } else {
        newText.selectEnd();
    }
    cleanupInsertedParagraph = () => {
        scheduleMicrotask(() => {
            editor.update(() => {
                $addUpdateTag('skip-dom-selection');
                newText.remove();
            });
        });
    };
};
