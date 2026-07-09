import { $isElementNode, $isTextNode, type LexicalNode } from 'lexical';
import { Action, SKIP } from './selectAction';

export const actionForPrevious = (
    selectedNode: LexicalNode,
    selectionFocusOffset: number,
    eventKey: 'ArrowLeft' | 'ArrowUp' | 'Backspace'
): Action => {
    if (eventKey === 'Backspace') {
        return SKIP;
    }
    const parents = selectedNode.getParents();
    const top = parents[parents.length - 1];
    if (!$isElementNode(top)) {
        return SKIP;
    }
    if (eventKey === 'ArrowLeft') {
        const first = top.getFirstDescendant();
        if (!first || selectedNode.getKey() !== first.getKey()) {
            return SKIP;
        }
        if (selectionFocusOffset !== 0) {
            return SKIP;
        }
        if (!$isTextNode(first) || first.getFormat() > 0) {
            return {
                action: 'insertSpaceBefore',
                node: first
            };
        }
    } else if (eventKey === 'ArrowUp') {
        const first = top.getFirstChild();
        if (!first || (first.getKey() !== selectedNode.getKey() && !first.isParentOf(selectedNode))) {
            return SKIP;
        }
        const newlineIndex = first.getTextContent().lastIndexOf('\n');
        if (newlineIndex >= 0 && selectionFocusOffset > newlineIndex) {
            return SKIP;
        }
    }

    return {
        action: 'selectOrCreatePreviousParagraph'
    };
};

export const needsToFocusPrevious = (
    selectedNode: LexicalNode,
    selectionFocusOffset: number,
    eventKey: 'ArrowLeft' | 'ArrowUp' | 'Backspace',
    testNode: (node: LexicalNode | null | undefined) => boolean
) => {
    const elementNode =
        $isElementNode(selectedNode) && !selectedNode.isInline() ? selectedNode : selectedNode.getParent();
    if (!elementNode) {
        return false;
    }
    const first = elementNode.getFirstDescendant();

    if (first && (eventKey === 'ArrowLeft' || eventKey === 'Backspace')) {
        if (selectedNode.getKey() !== first.getKey()) {
            return false;
        }
        if (selectionFocusOffset !== 0) {
            return false;
        }
    }
    const nextNode = elementNode?.getPreviousSibling();
    return testNode(nextNode);
};
