/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @see https://github.com/facebook/lexical/blob/main/packages/lexical-link/src/index.ts
 *
 */

import type {
    BaseSelection,
    EditorConfig,
    LexicalCommand,
    LexicalNode,
    NodeKey,
    RangeSelection,
    SerializedElementNode
} from 'lexical';

import { $findMatchingParent, addClassNamesToElement } from '@lexical/utils';
import {
    $applyNodeReplacement,
    $getSelection,
    $isElementNode,
    $isRangeSelection,
    createCommand,
    ElementNode,
    Spread
} from 'lexical';
import { $getAncestor } from '@tdev-components/Cms/MdxEditor/helpers/lexical/get-ancestors';
import { $withSelectedNodes } from '@tdev-components/Cms/MdxEditor/helpers/lexical/with-selected-nodes';

export type SerializedBoxNode = Spread<{}, SerializedElementNode>;

type BoxHTMLElementType = HTMLElement | HTMLSpanElement;

/** @noInheritDoc */
export class BoxNode extends ElementNode {
    static getType(): string {
        return 'box';
    }

    static clone(node: BoxNode): BoxNode {
        return new BoxNode(node.__key);
    }

    constructor(key?: NodeKey) {
        super(key);
    }

    createDOM(config: EditorConfig): BoxHTMLElementType {
        const element = document.createElement('strong');
        addClassNamesToElement(element, 'boxed');
        return element;
    }

    updateDOM(config: EditorConfig): boolean {
        return false;
    }

    static importJSON(serializedNode: SerializedBoxNode): BoxNode {
        console.log(serializedNode);
        return $createBoxNode().updateFromJSON(serializedNode);
    }

    exportJSON(): SerializedBoxNode {
        return super.exportJSON();
    }

    insertNewAfter(_: RangeSelection, restoreSelection = true): null | ElementNode {
        const boxNode = $createBoxNode();
        this.insertAfter(boxNode, restoreSelection);
        return boxNode;
    }

    canInsertTextBefore(): true {
        return true;
    }

    canInsertTextAfter(): true {
        return true;
    }

    canBeEmpty(): false {
        return false;
    }

    isInline(): true {
        return true;
    }

    extractWithChild(child: LexicalNode, selection: BaseSelection, destination: 'clone' | 'html'): boolean {
        if (!$isRangeSelection(selection)) {
            return false;
        }
        const anchorNode = selection.anchor.getNode();
        const focusNode = selection.focus.getNode();

        return (
            this.isParentOf(anchorNode) && this.isParentOf(focusNode) && selection.getTextContent().length > 0
        );
    }
}

/**
 * Creates a BoxNode.
 * @returns The BoxNode.
 */
export function $createBoxNode(): BoxNode {
    return $applyNodeReplacement(new BoxNode());
}

/**
 * Determines if node is a BoxNode.
 * @param node - The node to be checked.
 * @returns true if node is a BoxNode, false otherwise.
 */
export function $isBoxNode(node: LexicalNode | null | undefined): node is BoxNode {
    return node instanceof BoxNode;
}

export const TOGGLE_BOX_COMMAND: LexicalCommand<boolean | null> = createCommand('TOGGLE_BOX_COMMAND');

/**
 * Generates or updates a BoxNode. It can also delete a BoxNode if the URL is null,
 * but saves any children and brings them up to the parent node.
 * @param boxOn - The URL the link directs to.
 * @param attributes - Optional HTML a tag attributes. \\{ target, rel, title \\}
 */
export function $toggleBoxed(boxOn: boolean): void {
    const selection = $getSelection();
    console.log('TOGGLE_BOX_COMMAND', boxOn, selection);
    if (!$isRangeSelection(selection)) {
        return;
    }
    const nodes = selection.extract();

    if (boxOn === false) {
        // Remove BoxNodes
        nodes.forEach((node) => {
            const parentBox = $findMatchingParent(node, (parent): parent is BoxNode => $isBoxNode(parent));

            if (parentBox) {
                const children = parentBox.getChildren();

                for (let i = 0; i < children.length; i++) {
                    parentBox.insertBefore(children[i]);
                }

                parentBox.remove();
            }
        });
        return;
    }
    const updatedNodes = new Set<NodeKey>();
    const updateBoxNode = (boxNode: BoxNode) => {
        if (updatedNodes.has(boxNode.getKey())) {
            return;
        }
        updatedNodes.add(boxNode.getKey());
    };
    // Add or merge BoxNodes
    if (nodes.length === 1) {
        const firstNode = nodes[0];
        // if the first node is a BoxNode or if its
        // parent is a BoxNode, we update the URL, target and rel.
        const boxNode = $getAncestor(firstNode, $isBoxNode);
        if (boxNode !== null) {
            return updateBoxNode(boxNode);
        }
    }

    $withSelectedNodes(() => {
        let boxNode: BoxNode | null = null;
        for (const node of nodes) {
            if (!node.isAttached()) {
                continue;
            }
            const parentBoxNode = $getAncestor(node, $isBoxNode);
            if (parentBoxNode) {
                updateBoxNode(parentBoxNode);
                continue;
            }
            if ($isElementNode(node)) {
                if (!node.isInline()) {
                    // Ignore block nodes, if there are any children we will see them
                    // later and wrap in a new BoxNode
                    continue;
                }
                if ($isBoxNode(node)) {
                    // If it's not an autolink node and we don't already have a BoxNode
                    // in this block then we can update it and re-use it
                    if (boxNode === null || !boxNode.getParentOrThrow().isParentOf(node)) {
                        updateBoxNode(node);
                        boxNode = node;
                        continue;
                    }
                    // Unwrap BoxNode
                    for (const child of node.getChildren()) {
                        node.insertBefore(child);
                    }
                    node.remove();
                    continue;
                }
            }
            const prevBoxNode = node.getPreviousSibling();
            if ($isBoxNode(prevBoxNode) && prevBoxNode.is(boxNode)) {
                prevBoxNode.append(node);
                continue;
            }
            boxNode = $createBoxNode();
            node.insertAfter(boxNode);
            boxNode.append(node);
        }
    });
}
