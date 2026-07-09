/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @see https://github.com/facebook/lexical/blob/main/packages/lexical-link/src/index.ts
 *
 */

import type { EditorConfig, LexicalNode, NodeKey } from 'lexical';

import { $applyNodeReplacement } from 'lexical';
import { FootnoteNode, SerializedDefinitionNode } from './Footnote';
import styles from './styles.module.scss';

type ReferenceHTMLElementType = HTMLElement | HTMLSpanElement;

/** @noInheritDoc */
export class FootnoteReferenceNode extends FootnoteNode {
    static getType(): string {
        return 'footnoteReference';
    }

    static clone(node: FootnoteReferenceNode): FootnoteReferenceNode {
        return new FootnoteReferenceNode(node.__identifier, node.__key);
    }

    constructor(id: string, key?: NodeKey) {
        super(id, key);
    }

    createDOM(config: EditorConfig): ReferenceHTMLElementType {
        const element = document.createElement('sup');
        element.classList.add(styles.footnoteReference);
        return element;
    }

    canInsertTextAfter(): true {
        return true;
    }

    isInline(): true {
        return true;
    }

    static importJSON(serializedNode: SerializedDefinitionNode): FootnoteNode {
        const { identifier } = serializedNode;
        return $createFootnoteReferenceNode(identifier).updateFromJSON(serializedNode);
    }
}

/**
 * Creates a LinkReference.
 * @returns The LinkReference.
 */
export function $createFootnoteReferenceNode(id: string): FootnoteReferenceNode {
    return $applyNodeReplacement(new FootnoteReferenceNode(id));
}

/**
 * Determines if node is a LinkReference.
 * @param node - The node to be checked.
 * @returns true if node is a LinkReference, false otherwise.
 */
export function $isFootnoteReferenceNode(
    node: LexicalNode | null | undefined
): node is FootnoteReferenceNode {
    return node instanceof FootnoteReferenceNode;
}
