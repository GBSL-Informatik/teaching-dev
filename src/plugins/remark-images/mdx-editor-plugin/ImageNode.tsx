/**
 * By Mdx Editor, @url https://github.com/mdx-editor/editor/tree/main/src/plugins/image
 */

import React from 'react';
import type {
    EditorConfig,
    LexicalEditor,
    LexicalNode,
    NodeKey,
    SerializedLexicalNode,
    Spread
} from 'lexical';

import { DecoratorNode } from 'lexical';
import { ImageComponent } from './ImageComponent';
import { parseOptions } from '@tdev/plugins/helpers';
import { observer } from 'mobx-react-lite';

/**
 * A serialized representation of an {@link ImageNode}.
 * @group Image
 */
export type SerializedImageNode = Spread<
    {
        altText: string;
        src: string;
        type: 'image';
        version: 1;
    },
    SerializedLexicalNode
>;

/**
 * A lexical node that represents an image. Use {@link "$createImageNode"} to construct one.
 * @group Image
 */
export class ImageNode extends DecoratorNode<React.ReactNode> {
    /** @internal */
    __src: string;
    /** @internal */
    __width?: number;

    /** @internal */
    static getType(): string {
        return 'image';
    }

    /** @internal */
    static clone(node: ImageNode): ImageNode {
        return new ImageNode(node.__src, node.getAltText(), node.__key);
    }

    /** @internal */
    static importJSON(serializedNode: SerializedImageNode): ImageNode {
        const { altText, src } = serializedNode;
        const node = $createImageNode({
            altText,
            src
        });
        return node;
    }

    /**
     * Constructs a new {@link ImageNode} with the specified image parameters.
     * Use {@link $createImageNode} to construct one.
     */
    constructor(src: string, altText: string, key?: NodeKey) {
        super(key);
        this.__src = src;
        this.__width = (parseOptions(altText, true) as any).width;
    }

    /** @internal */
    exportJSON(): SerializedImageNode {
        return {
            altText: this.getAltText(),
            src: this.getSrc(),
            type: 'image',
            version: 1
        };
    }

    setWidth(width: number | undefined): void {
        this.getWritable().__width = width;
    }

    getAltText(): string {
        if (!this.__width) {
            return '';
        }
        return `--width=${this.__width}`;
    }

    /** @internal */
    createDOM(config: EditorConfig): HTMLElement {
        return document.createElement('span');
    }

    /** @internal */
    updateDOM(): false {
        return false;
    }

    getSrc(): string {
        return this.__src;
    }

    setSrc(src: string): void {
        this.getWritable().__src = src;
    }

    /** @internal */
    decorate(_parentEditor: LexicalEditor): React.ReactNode {
        return <ImageComponent src={this.getSrc()} nodeKey={this.getKey()} width={this.__width} />;
    }
}

/**
 * The parameters used to create an {@link ImageNode} through {@link $createImageNode}.
 * @group Image
 */
export interface CreateImageNodeParameters {
    altText: string;
    key?: NodeKey;
    src: string;
}

/**
 * Creates an {@link ImageNode}.
 * @param params - The image attributes.
 * @group Image
 */
export function $createImageNode(params: CreateImageNodeParameters): ImageNode {
    const { altText, src, key } = params;
    return new ImageNode(src, altText, key);
}

/**
 * Retruns true if the node is an {@link ImageNode}.
 * @group Image
 */
export function $isImageNode(node: LexicalNode | null | undefined): node is ImageNode {
    return node instanceof ImageNode;
}
