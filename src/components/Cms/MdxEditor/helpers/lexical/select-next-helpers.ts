import { $isElementNode, $isTextNode, type LexicalNode } from 'lexical';
import { Action, SKIP } from './selectAction';

export const actionForNext = (
    selectedNode: LexicalNode,
    selectionFocusOffset: number,
    eventKey: 'ArrowRight' | 'ArrowDown'
): Action => {
    const parents = selectedNode.getParents();
    const top = parents[parents.length - 1];
    if (!$isElementNode(top)) {
        return SKIP;
    }
    if (eventKey === 'ArrowRight') {
        const last = top.getLastDescendant();
        if (!last || selectedNode.getKey() !== last.getKey()) {
            return SKIP;
        }
        const end = last.getTextContentSize();
        if (selectionFocusOffset !== end) {
            return SKIP;
        }
        if (!$isTextNode(last) || last.getFormat() > 0) {
            return {
                action: 'insertSpaceAfter',
                node: last
            };
        }
    } else if (eventKey === 'ArrowDown') {
        const last = top.getLastChild();
        if (!last || (last.getKey() !== selectedNode.getKey() && !last.isParentOf(selectedNode))) {
            return SKIP;
        }
        const newlineIndex = last.getTextContent().lastIndexOf('\n');
        if (newlineIndex >= 0 && selectionFocusOffset <= newlineIndex) {
            return SKIP;
        }
    }

    return {
        action: 'selectOrCreateNextParagraph'
    };
};

export const needsToFocusNext = (
    selectedNode: LexicalNode,
    selectionFocusOffset: number,
    eventKey: 'ArrowRight' | 'ArrowDown',
    testNode: (node: LexicalNode | null | undefined) => boolean
) => {
    const elementNode =
        $isElementNode(selectedNode) && !selectedNode.isInline() ? selectedNode : selectedNode.getParent();
    if (!elementNode) {
        return false;
    }
    const last = elementNode.getLastChild();

    if (last && eventKey === 'ArrowRight') {
        if (selectedNode.getKey() !== last.getKey()) {
            return false;
        }
        const end = last.getTextContentSize();
        if (selectionFocusOffset !== end) {
            return false;
        }
    }
    const nextNode = elementNode?.getNextSibling();
    return testNode(nextNode);
};
