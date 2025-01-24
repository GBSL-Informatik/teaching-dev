/**
 * By Mdx Editor, @url https://github.com/mdx-editor/editor/tree/main/src/plugins/image
 */

import * as Mdast from 'mdast';
import { ImageNode, $isImageNode } from './ImageNode';
import { LexicalExportVisitor } from '@mdxeditor/editor';

export const LexicalImageVisitor: LexicalExportVisitor<ImageNode, Mdast.Image> = {
    testLexicalNode: $isImageNode,
    visitLexicalNode({ mdastParent, lexicalNode, actions }) {
        actions.appendToParent(mdastParent, {
            type: 'image',
            url: lexicalNode.getSrc(),
            alt: lexicalNode.getAltText()
        });
    }
};
