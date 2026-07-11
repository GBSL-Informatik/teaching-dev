import { Strong } from 'mdast';
import { $isBoxNode, BoxNode } from './BoxNode';
import { LexicalExportVisitor } from '@mdxeditor/editor';

export const LexicalBoxVisitor: LexicalExportVisitor<BoxNode, Strong> = {
    testLexicalNode: $isBoxNode,
    visitLexicalNode({ actions }) {
        actions.addAndStepInto('box');
    }
};
