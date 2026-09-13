/**
 * By Mdx Editor, @url https://github.com/mdx-editor/editor/tree/main/src/plugins/image
 */

import { MdastImportVisitor } from '@mdxeditor/editor';
import * as Mdast from 'mdast';
import { ImageCaption, ImageFigure } from '.';
import { $createImageCaptionNode } from './ImageCaptionNode';
import { $createImageFigureNode } from './ImageFigureNode';
import { $createImageNode } from './ImageNode';

export const MdastImageVisitor: MdastImportVisitor<Mdast.Image> = {
    testNode: 'image',
    visitNode({ mdastNode, actions }) {
        actions.addAndStepInto(
            $createImageNode({
                src: mdastNode.url,
                altText: mdastNode.alt ?? ''
            })
        );
    },
    priority: 1
};

export const MdastImageCaptionVisitor: MdastImportVisitor<ImageCaption> = {
    testNode: 'imageCaption',
    visitNode({ actions }) {
        actions.addAndStepInto($createImageCaptionNode());
    },
    priority: 1
};

export const MdastImageFigureVisitor: MdastImportVisitor<ImageFigure> = {
    testNode: 'imageFigure',
    visitNode({ actions }) {
        actions.addAndStepInto($createImageFigureNode());
    },
    priority: 1
};
