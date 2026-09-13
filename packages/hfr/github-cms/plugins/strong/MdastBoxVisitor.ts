/**
 * By Mdx Editor, @url https://github.com/mdx-editor/editor/tree/main/src/plugins/image
 */

import { MdastImportVisitor } from '@mdxeditor/editor';
import type { Box } from '.';
import { $createBoxNode } from './BoxNode';

export const MdastBoxVisitor: MdastImportVisitor<Box> = {
    testNode: 'box',
    visitNode({ actions }) {
        actions.addAndStepInto($createBoxNode());
    },
    priority: 1
};
