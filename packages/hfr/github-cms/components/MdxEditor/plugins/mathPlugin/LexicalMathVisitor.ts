import { LexicalExportVisitor } from '@mdxeditor/editor';
import { $isMathNode, MathNode } from './MathNode';
import { InlineMath, Math } from 'mdast-util-math';

export const LexicalMathVisitor: LexicalExportVisitor<MathNode, Math | InlineMath> = {
    testLexicalNode: $isMathNode,
    visitLexicalNode({ actions, lexicalNode, mdastParent }) {
        if (lexicalNode.getMdastNode().type === 'inlineMath') {
            actions.addAndStepInto('inlineMath', { value: lexicalNode.getMdastNode().value });
        } else {
            actions.addAndStepInto('math', { value: lexicalNode.getMdastNode().value });
        }
    }
};
