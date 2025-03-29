import scheduleMicrotask from '@tdev-components/util/scheduleMicrotask';
import {
    $createTextNode,
    $getSelection,
    $isRangeSelection,
    COMMAND_PRIORITY_LOW,
    ElementNode,
    KEY_DOWN_COMMAND,
    LexicalEditor,
    LexicalNode
} from 'lexical';

const handleFocusNextInline = (testNode: (node: LexicalNode | null | undefined) => node is ElementNode) => {
    return (editor: LexicalEditor) => {
        return editor.registerCommand<KeyboardEvent>(
            KEY_DOWN_COMMAND,
            (event, activeEditor) => {
                if (event.key !== 'ArrowRight') {
                    return false;
                }
                const selection = $getSelection();
                if ($isRangeSelection(selection)) {
                    const nodes = selection.getNodes();
                    const selectedNode = nodes[nodes.length - 1];
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
                    const last = node.getLastChild();
                    if (!last) {
                        return false;
                    }
                    if (selectedNode.getKey() !== last.getKey()) {
                        return false;
                    }

                    const next = node.getNextSibling();
                    const end = last.getTextContentSize();
                    if (selection.focus.offset === end && !next) {
                        const textNode = $createTextNode(' ');
                        node?.insertAfter(textNode);
                        textNode.selectEnd();
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

export default handleFocusNextInline;
