/**
 * By Mdx Editor, @url https://github.com/mdx-editor/editor/tree/main/src/plugins/image
 */

import * as Mdast from 'mdast';
import { ImageNode, $isImageNode } from './ImageNode';
import { LexicalExportVisitor } from '@mdxeditor/editor';
import { $isImageFigureNode, ImageFigureNode } from './ImageFigureNode';
import { $isImageCaptionNode, ImageCaptionNode } from './ImageCaptionNode';
import { ImageCaption, ImageFigure } from '.';

export const LexicalImageVisitor: LexicalExportVisitor<ImageNode, Mdast.Image> = {
    testLexicalNode: $isImageNode,
    visitLexicalNode({ mdastParent, lexicalNode, actions }) {
        actions.appendToParent(mdastParent, {
            type: 'image',
            url: lexicalNode.getSrc(),
            data: lexicalNode.getOptions(),
            alt: lexicalNode.getAltText()
        });
    }
};
export const LexicalImageFigureVisitor: LexicalExportVisitor<ImageFigureNode, ImageFigure> = {
    testLexicalNode: $isImageFigureNode,
    visitLexicalNode({ mdastParent, lexicalNode, actions }) {
        actions.addAndStepInto('imageFigure');
    }
};
export const LexicalImageCaptionVisitor: LexicalExportVisitor<ImageCaptionNode, ImageCaption> = {
    testLexicalNode: $isImageCaptionNode,
    visitLexicalNode({ mdastParent, lexicalNode, actions }) {
        actions.addAndStepInto('imageCaption');
    }
};
