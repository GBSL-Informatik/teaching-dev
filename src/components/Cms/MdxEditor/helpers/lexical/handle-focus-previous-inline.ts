import scheduleMicrotask from '@tdev-components/util/scheduleMicrotask';
import {
    $createTextNode,
    $getSelection,
    $isRangeSelection,
    COMMAND_PRIORITY_EDITOR,
    COMMAND_PRIORITY_LOW,
    ElementNode,
    KEY_DOWN_COMMAND,
    LexicalEditor,
    LexicalNode
} from 'lexical';

const handleFocusPreviousInline = (
    testNode: (node: LexicalNode | null | undefined) => node is ElementNode
) => {
    return (editor: LexicalEditor) => {
        return editor.registerCommand<KeyboardEvent>(
            KEY_DOWN_COMMAND,
            (event, activeEditor) => {
                if (event.key !== 'ArrowLeft') {
                    return false;
                }
                const selection = $getSelection();
                if ($isRangeSelection(selection)) {
                    const selectedNode = selection.getNodes()[0];
                    if (!selectedNode) {
                        return false;
                    }
                    const isFirstNode = testNode(selectedNode);
                    const node = isFirstNode
                        ? selectedNode
                        : selectedNode.getParents().find((parent) => testNode(parent));
                    if (!node) {
                        return false;
                    }
                    const prev = node.getPreviousSibling();
                    const ancestors = node.getParents();
                    // a kbd is in a paragraph and the paragraph is inside a root node...
                    if (
                        selection.focus.offset === 0 &&
                        !prev &&
                        (ancestors.length < 3 ||
                            ancestors[2].getTextContentSize() === ancestors[1].getTextContentSize())
                    ) {
                        const textNode = $createTextNode(' ');
                        node?.insertBefore(textNode);
                        textNode.selectStart();
                        event.preventDefault();
                        event.stopPropagation();
                        return true;
                    }
                }
                return false;
            },
            COMMAND_PRIORITY_LOW
        );
    };
};

export default handleFocusPreviousInline;
