/**
 * By Mdx Editor, @url https://github.com/mdx-editor/editor/tree/main/src/plugins/image
 */

import { MdastImportVisitor } from '@mdxeditor/editor';
import { $createKbdNode } from './KbdNode';
import type { Kbd } from '.';

export const MdastKbdVisitor: MdastImportVisitor<Kbd> = {
    testNode: 'kbd',
    visitNode({ actions }) {
        actions.addAndStepInto($createKbdNode());
    },
    priority: 1
};
