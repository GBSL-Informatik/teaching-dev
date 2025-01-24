/**
 * By Mdx Editor, @url https://github.com/mdx-editor/editor/tree/main/src/plugins/image
 */

import * as Mdast from 'mdast';
import { $createImageNode } from './ImageNode';
import { MdastImportVisitor } from '@mdxeditor/editor';

export const MdastImageVisitor: MdastImportVisitor<Mdast.Image> = {
    testNode: 'image',
    visitNode({ mdastNode, actions }) {
        actions.addAndStepInto(
            $createImageNode({
                src: mdastNode.url,
                altText: mdastNode.alt ?? ''
            })
        );
    }
};
