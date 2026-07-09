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

type DefinitionHTMLElementType = HTMLElement | HTMLDivElement;

/** @noInheritDoc */
export class FootnoteDefinitionNode extends FootnoteNode {
    static getType(): string {
        return 'footnoteDefinition';
    }

    static clone(node: FootnoteDefinitionNode): FootnoteDefinitionNode {
        return new FootnoteDefinitionNode(node.__identifier, node.__key);
    }

    constructor(id: string, key?: NodeKey) {
        super(id, key);
    }

    createDOM(config: EditorConfig): DefinitionHTMLElementType {
        const element = document.createElement('div');
        element.classList.add(styles.footnoteDefinition);
        return element;
    }

    canInsertTextAfter(): true {
        return true;
    }

    isInline(): boolean {
        return false;
    }

    static importJSON(serializedNode: SerializedDefinitionNode): FootnoteDefinitionNode {
        const { identifier } = serializedNode;
        return $createFootnoteDefinitionNode(identifier).updateFromJSON(serializedNode);
    }
}

/**
 * Creates a DefinitionNode.
 * @returns The DefinitionNode.
 */
export function $createFootnoteDefinitionNode(id: string): FootnoteDefinitionNode {
    return $applyNodeReplacement(new FootnoteDefinitionNode(id));
}

/**
 * Determines if node is a DefinitionNode.
 * @param node - The node to be checked.
 * @returns true if node is a DefinitionNode, false otherwise.
 */
export function $isFootnoteDefinitioNode(
    node: LexicalNode | null | undefined
): node is FootnoteDefinitionNode {
    return node instanceof FootnoteDefinitionNode;
}
