/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @see https://github.com/facebook/lexical/blob/main/packages/lexical-link/src/index.ts
 *
 */

import type { BaseSelection, EditorConfig, LexicalNode, NodeKey, SerializedElementNode } from 'lexical';

import { $applyNodeReplacement, $isRangeSelection, ElementNode, Spread } from 'lexical';
import styles from './styles.module.scss';

export type SerializedImageFigureNode = Spread<{}, SerializedElementNode>;

type ImageFigureHTMLElementType = HTMLElement;

/** @noInheritDoc */
export class ImageFigureNode extends ElementNode {
    static getType(): string {
        return 'imageFigure';
    }

    static clone(node: ImageFigureNode): ImageFigureNode {
        return new ImageFigureNode(node.__key);
    }

    constructor(key?: NodeKey) {
        super(key);
    }

    createDOM(config: EditorConfig): ImageFigureHTMLElementType {
        const element = document.createElement('div');
        element.classList.add(styles.imageFigure);
        return element;
    }

    updateDOM(config: EditorConfig): boolean {
        return false;
    }

    static importJSON(serializedNode: SerializedImageFigureNode): ImageFigureNode {
        return $createImageFigureNode().updateFromJSON(serializedNode);
    }

    exportJSON(): SerializedImageFigureNode {
        return super.exportJSON();
    }

    canInsertTextBefore(): false {
        return false;
    }

    canInsertTextAfter(): false {
        return false;
    }

    canBeEmpty(): false {
        return false;
    }

    isInline(): false {
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
 * Creates a BoxNode.
 * @returns The BoxNode.
 */
export function $createImageFigureNode(): ImageFigureNode {
    return $applyNodeReplacement(new ImageFigureNode());
}

/**
 * Determines if node is a BoxNode.
 * @param node - The node to be checked.
 * @returns true if node is a BoxNode, false otherwise.
 */
export function $isImageFigureNode(node: LexicalNode | null | undefined): node is ImageFigureNode {
    return node instanceof ImageFigureNode;
}
