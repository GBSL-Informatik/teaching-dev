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
import { $getAncestor } from '@tdev-components/MdxEditor/helpers/lexical/get-ancestors';
import { $withSelectedNodes } from '@tdev-components/MdxEditor/helpers/lexical/with-selected-nodes';

export type SerializedImageCaptionNode = Spread<{}, SerializedElementNode>;

type ImageCaptionHTMLElementType = HTMLElement;

/** @noInheritDoc */
export class ImageCaptionNode extends ElementNode {
    static getType(): string {
        return 'imageCaption';
    }

    static clone(node: ImageCaptionNode): ImageCaptionNode {
        return new ImageCaptionNode(node.__key);
    }

    constructor(key?: NodeKey) {
        super(key);
    }

    createDOM(config: EditorConfig): ImageCaptionHTMLElementType {
        const element = document.createElement('div');
        return element;
    }

    updateDOM(config: EditorConfig): boolean {
        return false;
    }

    static importJSON(serializedNode: SerializedImageCaptionNode): ImageCaptionNode {
        return $createImageCaptionNode().updateFromJSON(serializedNode);
    }

    exportJSON(): SerializedImageCaptionNode {
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
export function $createImageCaptionNode(): ImageCaptionNode {
    return $applyNodeReplacement(new ImageCaptionNode());
}

/**
 * Determines if node is a BoxNode.
 * @param node - The node to be checked.
 * @returns true if node is a BoxNode, false otherwise.
 */
export function $isImageCaptionNode(node: LexicalNode | null | undefined): node is ImageCaptionNode {
    return node instanceof ImageCaptionNode;
}
