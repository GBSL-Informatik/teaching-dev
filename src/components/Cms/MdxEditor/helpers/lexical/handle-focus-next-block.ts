import scheduleMicrotask from '@tdev-components/util/scheduleMicrotask';
import { test } from 'gray-matter';
import {
    $createParagraphNode,
    $createTextNode,
    $getSelection,
    $isRangeSelection,
    COMMAND_PRIORITY_LOW,
    DecoratorNode,
    ElementNode,
    KEY_DOWN_COMMAND,
    LexicalEditor,
    LexicalNode
} from 'lexical';

const handleFocusNextBlock = (testNode: (node: LexicalNode | null | undefined) => node is ElementNode) => {
    return (editor: LexicalEditor) => {
        return editor.registerCommand<KeyboardEvent>(
            KEY_DOWN_COMMAND,
            (event, activeEditor) => {
                switch (event.key) {
                    case 'ArrowRight':
                        const selection = $getSelection();
                        if ($isRangeSelection(selection)) {
                            const nodes = selection.getNodes();
                            const selectedNode = nodes[nodes.length - 1];
                            if (!selectedNode) {
                                return false;
                            }
                            const nextNode = selectedNode.getParent()?.getNextSibling();
                            if (testNode(nextNode)) {
                                event.preventDefault();
                                event.stopPropagation();
                                return true;
                            }
                            const isFirstNode = testNode(selectedNode);
                            const node = isFirstNode
                                ? selectedNode
                                : selectedNode.getParents().find((parent) => testNode(parent));
                            if (!node || node instanceof DecoratorNode) {
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
                                const p = $createParagraphNode();
                                const text = $createTextNode('');
                                p.append(text);
                                node.insertAfter(p);
                                text.selectStart();
                                event.preventDefault();
                                event.stopPropagation();
                                return true;
                            }
                        }
                        break;
                    case 'ArrowDown':
                        break;
                    default:
                        return false;
                }
                return false;
            },
            COMMAND_PRIORITY_LOW
        );
    };
};

export default handleFocusNextBlock;
