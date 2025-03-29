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

import { $findMatchingParent } from '@lexical/utils';
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

export type SerializedKbdNode = Spread<{}, SerializedElementNode>;

type KbdHTMLElementType = HTMLElement;

/** @noInheritDoc */
export class KbdNode extends ElementNode {
    static getType(): string {
        return 'kbd';
    }

    static clone(node: KbdNode): KbdNode {
        return new KbdNode(node.__key);
    }

    constructor(key?: NodeKey) {
        super(key);
    }

    createDOM(config: EditorConfig): KbdHTMLElementType {
        const element = document.createElement('kbd');
        return element;
    }

    updateDOM(config: EditorConfig): boolean {
        return false;
    }

    static importJSON(serializedNode: SerializedKbdNode): KbdNode {
        return $createKbdNode().updateFromJSON(serializedNode);
    }

    exportJSON(): SerializedKbdNode {
        return super.exportJSON();
    }

    insertNewAfter(_: RangeSelection, restoreSelection = true): null | ElementNode {
        const kbdNode = $createKbdNode();
        this.insertAfter(kbdNode, restoreSelection);
        return kbdNode;
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
export function $createKbdNode(): KbdNode {
    return $applyNodeReplacement(new KbdNode());
}

/**
 * Determines if node is a BoxNode.
 * @param node - The node to be checked.
 * @returns true if node is a BoxNode, false otherwise.
 */
export function $isKbdNode(node: LexicalNode | null | undefined): node is KbdNode {
    return node instanceof KbdNode;
}

export const TOGGLE_KBD_COMMAND: LexicalCommand<boolean | null> = createCommand('TOGGLE_KBD_COMMAND');

/**
 * Generates or updates a BoxNode. It can also delete a BoxNode if the URL is null,
 * but saves any children and brings them up to the parent node.
 * @param boxedOn - The URL the link directs to.
 * @param attributes - Optional HTML a tag attributes. \\{ target, rel, title \\}
 */
export function $toggleKbd(boxedOn: boolean): void {
    const selection = $getSelection();

    if (!$isRangeSelection(selection)) {
        return;
    }
    const nodes = selection.extract();

    if (boxedOn === false) {
        // Remove BoxNodes
        nodes.forEach((node) => {
            const parentKbd = $findMatchingParent(node, (parent): parent is KbdNode => $isKbdNode(parent));

            if (parentKbd) {
                const children = parentKbd.getChildren();

                for (let i = 0; i < children.length; i++) {
                    parentKbd.insertBefore(children[i]);
                }

                parentKbd.remove();
            }
        });
        return;
    }
    const updatedNodes = new Set<NodeKey>();
    const updateKbdNode = (boxNode: KbdNode) => {
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
        const boxNode = $getAncestor(firstNode, $isKbdNode);
        if (boxNode !== null) {
            return updateKbdNode(boxNode);
        }
    }

    $withSelectedNodes(() => {
        let kbdNode: KbdNode | null = null;
        for (const node of nodes) {
            if (!node.isAttached()) {
                continue;
            }
            const parentKbdNode = $getAncestor(node, $isKbdNode);
            if (parentKbdNode) {
                updateKbdNode(parentKbdNode);
                continue;
            }
            if ($isElementNode(node)) {
                if (!node.isInline()) {
                    // Ignore block nodes, if there are any children we will see them
                    // later and wrap in a new KbdNode
                    continue;
                }
                if ($isKbdNode(node)) {
                    // If we don't already have a KbdNode
                    // in this block then we can update it and re-use it
                    if (kbdNode === null || !kbdNode.getParentOrThrow().isParentOf(node)) {
                        updateKbdNode(node);
                        kbdNode = node;
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
            if ($isKbdNode(prevBoxNode) && prevBoxNode.is(kbdNode)) {
                prevBoxNode.append(node);
                continue;
            }
            kbdNode = $createKbdNode();
            node.insertAfter(kbdNode);
            kbdNode.append(node);
        }
    });
}
