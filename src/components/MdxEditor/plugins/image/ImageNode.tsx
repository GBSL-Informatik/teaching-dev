/**
 * By Mdx Editor, @url https://github.com/mdx-editor/editor/tree/main/src/plugins/image
 */

import React from 'react';
import type {
    DOMConversionMap,
    DOMConversionOutput,
    DOMExportOutput,
    EditorConfig,
    LexicalEditor,
    LexicalNode,
    NodeKey,
    SerializedLexicalNode,
    Spread
} from 'lexical';

import { DecoratorNode } from 'lexical';
import { ImageEditor } from './ImageEditor';
import { MdxJsxAttribute, MdxJsxExpressionAttribute } from 'mdast-util-mdx-jsx';
import { cleanedText, parseOptions } from '@tdev/plugins/helpers';

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
    __altText: string;

    /** @internal */
    static getType(): string {
        return 'image';
    }

    /** @internal */
    static clone(node: ImageNode): ImageNode {
        return new ImageNode(node.__src, node.__altText, node.__key);
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
        this.__altText = altText;
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
        const caption = cleanedText(this.__altText || '');
        if (caption) {
            this.setAltText(`${caption} --width=${width}px`);
        } else {
            this.setAltText(`--width=${width}px`);
        }
    }

    setCaption(caption: string): void {
        const width = (parseOptions(this.__altText || '', true) as any).width || undefined;
        if (width) {
            this.setAltText(`${caption} --width=${width}px`);
        } else {
            this.setAltText(caption);
        }
    }

    getCaption(): string {
        return cleanedText(this.__altText || '');
    }

    getWidth(): number | undefined {
        return (parseOptions(this.__altText || '', true) as any).width;
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

    getAltText(): string {
        return this.__altText;
    }

    setSrc(src: string): void {
        this.getWritable().__src = src;
    }

    setAltText(altText: string | undefined): void {
        this.getWritable().__altText = altText ?? '';
    }

    /** @internal */
    decorate(_parentEditor: LexicalEditor): React.ReactNode {
        return (
            <ImageEditor
                src={this.getSrc()}
                nodeKey={this.getKey()}
                alt={this.__altText}
                width={this.getWidth()}
                caption={this.getCaption()}
            />
        );
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
