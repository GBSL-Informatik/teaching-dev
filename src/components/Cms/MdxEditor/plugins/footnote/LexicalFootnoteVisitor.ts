import { $isFootnoteDefinitioNode, FootnoteDefinitionNode } from './FootnoteDefinition';
import { LexicalExportVisitor } from '@mdxeditor/editor';
import { FootnoteDefinition, FootnoteReference } from 'mdast';
import { $isFootnoteReferenceNode, FootnoteReferenceNode } from './FootnoteReference';

export const LexicalFootnoteDefinitionVisitor: LexicalExportVisitor<
    FootnoteDefinitionNode,
    FootnoteDefinition
> = {
    testLexicalNode: $isFootnoteDefinitioNode,
    visitLexicalNode({ actions, lexicalNode, mdastParent }) {
        const id = lexicalNode.getChildAtIndex<FootnoteReferenceNode>(0);
        if (id && id.getType() === 'footnoteReference') {
            actions.addAndStepInto('footnoteDefinition', { identifier: id.getTextContent() });
        } else {
            actions.addAndStepInto('footnoteDefinition', { identifier: lexicalNode.getIdentifier() });
        }
    }
};

export const LexicalFootnoteReferenceVisitor: LexicalExportVisitor<FootnoteReferenceNode, FootnoteReference> =
    {
        testLexicalNode: $isFootnoteReferenceNode,
        visitLexicalNode({ actions, mdastParent, lexicalNode }) {
            if (mdastParent.type === 'footnoteDefinition') {
                return;
            }
            actions.addAndStepInto('footnoteReference', { identifier: lexicalNode.getTextContent() });
        }
    };
