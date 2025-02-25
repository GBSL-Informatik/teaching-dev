/**
 * By Mdx Editor, @url https://github.com/mdx-editor/editor/tree/main/src/plugins/image
 */
import { $createTextNode } from 'lexical';
import { MdastImportVisitor } from '@mdxeditor/editor';
import { $createFootnoteReferenceNode } from './FootnoteReference';
import type { FootnoteDefinition, FootnoteReference } from 'mdast';
import { $createFootnoteDefinitionNode } from './FootnoteDefinition';

export const MdastFootnoteReferenceVisitor: MdastImportVisitor<FootnoteReference> = {
    testNode: 'footnoteReference',
    visitNode({ actions, mdastNode }) {
        const textId = $createTextNode(mdastNode.identifier);
        const ref = $createFootnoteReferenceNode(mdastNode.identifier);
        ref.append(textId);
        actions.addAndStepInto(ref);
    },
    priority: 1
};

export const MdastFootnoteDefinitionVisitor: MdastImportVisitor<FootnoteDefinition> = {
    testNode: 'footnoteDefinition',
    visitNode({ actions, mdastNode }) {
        const textId = $createTextNode(mdastNode.identifier);
        const ref = $createFootnoteReferenceNode(mdastNode.identifier);
        ref.append(textId);
        const def = $createFootnoteDefinitionNode(mdastNode.identifier);
        def.append(ref);
        actions.addAndStepInto(def);
    },
    priority: 1
};
