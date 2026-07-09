/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { voidEmitter } from '@mdxeditor/editor';
import type {
    EditorConfig,
    LexicalEditor,
    LexicalNode,
    NodeKey,
    SerializedLexicalNode,
    Spread
} from 'lexical';
import { DecoratorNode } from 'lexical';
import { InlineMath, Math } from 'mdast-util-math';
import React from 'react';
import JsxMathContainer from './JsxMathContainer';

/**
 * A serialized representation of an {@link LexicalJsxNode}.
 */
export type SerializedLexicalJsxNode = Spread<
    {
        mdastNode: Math | InlineMath;
        type: 'math';
        version: 1;
    },
    SerializedLexicalNode
>;

export class MathNode extends DecoratorNode<React.ReactNode> {
    __mdastNode: Math | InlineMath;
    __focusEmitter = voidEmitter();

    static getType(): string {
        return 'math';
    }

    static clone(node: MathNode): MathNode {
        return new MathNode(structuredClone(node.__mdastNode), node.__key);
    }

    static importJSON(serializedNode: SerializedLexicalJsxNode): MathNode {
        return $createMathNode(serializedNode.mdastNode);
    }

    constructor(mdastNode: Math | InlineMath, key?: NodeKey) {
        super(key);
        this.__mdastNode = mdastNode;
    }

    getMdastNode(): Math | InlineMath {
        return this.__mdastNode;
    }

    exportJSON(): SerializedLexicalJsxNode {
        return {
            mdastNode: this.getMdastNode(),
            type: 'math',
            version: 1
        };
    }

    createDOM(): HTMLElement {
        return document.createElement(this.__mdastNode.type === 'inlineMath' ? 'span' : 'div');
    }

    updateDOM(): false {
        return false;
    }

    setMdastNode(mdastNode: Math | InlineMath): void {
        this.getWritable().__mdastNode = mdastNode;
    }

    select = () => {
        this.__focusEmitter.publish();
    };

    decorate(parentEditor: LexicalEditor, config: EditorConfig): React.ReactNode {
        return (
            <JsxMathContainer
                lexicalJsxNode={this}
                config={config}
                mdastNode={this.getMdastNode()}
                parentEditor={parentEditor}
                focusEmitter={this.__focusEmitter}
            />
        );
    }

    isInline(): boolean {
        return this.__mdastNode.type === 'inlineMath';
    }

    isKeyboardSelectable(): boolean {
        return true;
    }
}

/**
 * Creates an {@link LexicalJsxNode}.
 */
export function $createMathNode(mdastNode: Math | InlineMath): MathNode {
    return new MathNode(mdastNode);
}

/**
 * Retruns true if the node is an {@link LexicalJsxNode}.
 */
export function $isMathNode(node: LexicalNode | null | undefined): node is MathNode {
    return node instanceof MathNode;
}
