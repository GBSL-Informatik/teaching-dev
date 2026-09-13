import { LexicalExportVisitor } from '@mdxeditor/editor';
import { Strong } from 'mdast';
import { $isKbdNode, KbdNode } from './KbdNode';

export const LexicalKbdVisitor: LexicalExportVisitor<KbdNode, Strong> = {
    testLexicalNode: $isKbdNode,
    visitLexicalNode({ actions }) {
        actions.addAndStepInto('kbd');
    }
};
