import { LexicalExportVisitor } from '@mdxeditor/editor';
import { Strong } from 'mdast';
import { $isBoxNode, BoxNode } from './BoxNode';

export const LexicalBoxVisitor: LexicalExportVisitor<BoxNode, Strong> = {
    testLexicalNode: $isBoxNode,
    visitLexicalNode({ actions }) {
        actions.addAndStepInto('box');
    }
};
