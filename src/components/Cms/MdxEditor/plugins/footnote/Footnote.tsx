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

import { $applyNodeReplacement, $isRangeSelection, ElementNode, Spread } from 'lexical';

export type SerializedDefinitionNode = Spread<
    {
        identifier: string;
    },
    SerializedElementNode
>;

/** @noInheritDoc */
export class FootnoteNode extends ElementNode {
    __identifier: string;
    static getType(): string {
        return 'footnote';
    }

    static clone(node: FootnoteNode): FootnoteNode {
        return new FootnoteNode(node.__key);
    }

    constructor(id: string, key?: NodeKey) {
        super(key);
        this.__identifier = id;
    }

    updateDOM(config: EditorConfig): boolean {
        return false;
    }

    static importJSON(serializedNode: SerializedDefinitionNode): FootnoteNode {
        const { identifier } = serializedNode;
        return $createFootnoteNode(identifier).updateFromJSON(serializedNode);
    }

    exportJSON(): SerializedDefinitionNode {
        return {
            ...super.exportJSON(),
            identifier: this.getIdentifier()
        };
    }

    getIdentifier(): string {
        return this.__identifier;
    }

    setIdentifier(id: string) {
        this.getWritable().__identifier = id;
    }

    insertNewAfter(_: RangeSelection, restoreSelection = true): null | ElementNode {
        const definitionNode = $createFootnoteNode('999');
        this.insertAfter(definitionNode, restoreSelection);
        return definitionNode;
    }

    canInsertTextBefore(): false {
        return false;
    }

    canBeEmpty(): false {
        return false;
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
 * Creates a DefinitionNode.
 * @returns The DefinitionNode.
 */
export function $createFootnoteNode(id: string): FootnoteNode {
    return $applyNodeReplacement(new FootnoteNode(id));
}

/**
 * Determines if node is a DefinitionNode.
 * @param node - The node to be checked.
 * @returns true if node is a DefinitionNode, false otherwise.
 */
export function $isFootnoteNode(node: LexicalNode | null | undefined): node is FootnoteNode {
    return node instanceof FootnoteNode;
}
