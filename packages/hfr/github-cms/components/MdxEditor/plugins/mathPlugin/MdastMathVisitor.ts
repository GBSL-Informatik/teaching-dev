/**
 * By Mdx Editor, @url https://github.com/mdx-editor/editor/tree/main/src/plugins/image
 */
import { MdastImportVisitor } from '@mdxeditor/editor';
import { InlineMath, Math } from 'mdast-util-math';
import { $createMathNode } from './MathNode';

export const MdastMathVisitor: MdastImportVisitor<Math> = {
    testNode: 'math',
    visitNode({ actions, mdastNode }) {
        actions.addAndStepInto($createMathNode(mdastNode));
    },
    priority: 1
};
export const MdastInlineMathVisitor: MdastImportVisitor<InlineMath> = {
    testNode: 'inlineMath',
    visitNode({ actions, mdastNode, lexicalParent }) {
        // lexicalParent.insertAfter($createMathNode(mdastNode));
        actions.addAndStepInto($createMathNode(mdastNode));
    },
    priority: 1
};
