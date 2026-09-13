/**
 * By Mdx Editor, @url https://github.com/mdx-editor/editor/tree/main/src/plugins/image
 */

import { MdastImportVisitor } from '@mdxeditor/editor';
import type { Kbd } from '.';
import { $createKbdNode } from './KbdNode';

export const MdastKbdVisitor: MdastImportVisitor<Kbd> = {
    testNode: 'kbd',
    visitNode({ actions }) {
        actions.addAndStepInto($createKbdNode());
    },
    priority: 1
};
