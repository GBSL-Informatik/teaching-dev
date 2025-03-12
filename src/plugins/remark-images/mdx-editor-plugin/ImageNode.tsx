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
import { camelCased, ParsedOptions, parseOptions, serializeOptions } from '@tdev/plugins/helpers';
import _ from 'lodash';

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

    __options: ParsedOptions;

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
        const opts = parseOptions(altText, true);
        this.__options = opts;
        this.__width = (opts as any).width || 200;
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

    setOptions(options: { name: string; value: number | string | undefined }[]) {
        const newOptions: Record<string, string | number> = {};
        options.forEach((option) => {
            if (option.name === 'width') {
                return this.setWidth(option.value as number);
            }
            if (!option.value || option.value === 'false') {
                delete newOptions[camelCased(option.name)];
                return;
            }
            newOptions[camelCased(option.name)] = option.value;
        });
        this.getWritable().__options = newOptions;
    }

    getAltText(): string {
        const alt = serializeOptions({ ...this.__options, width: this.__width });
        return alt;
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
