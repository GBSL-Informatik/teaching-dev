import { Strong } from 'mdast';
import { LexicalExportVisitor } from '@mdxeditor/editor';
import { $isKbdNode, KbdNode } from './KbdNode';

export const LexicalKbdVisitor: LexicalExportVisitor<KbdNode, Strong> = {
    testLexicalNode: $isKbdNode,
    visitLexicalNode({ actions }) {
        actions.addAndStepInto('kbd');
    }
};
