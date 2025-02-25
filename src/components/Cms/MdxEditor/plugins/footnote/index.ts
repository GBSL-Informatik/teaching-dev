/**
 * By Mdx Editor, @url https://github.com/mdx-editor/editor/tree/main/src/plugins/image
 */

import {
    addExportVisitor$,
    addImportVisitor$,
    addLexicalNode$,
    addToMarkdownExtension$,
    addMdastExtension$,
    realmPlugin,
    addSyntaxExtension$
} from '@mdxeditor/editor';
import { gfmFootnoteFromMarkdown, gfmFootnoteToMarkdown } from 'mdast-util-gfm-footnote';
import { gfmFootnote } from 'micromark-extension-gfm-footnote';
import { FootnoteDefinitionNode } from './FootnoteDefinition';
import { LexicalFootnoteDefinitionVisitor, LexicalFootnoteReferenceVisitor } from './LexicalFootnoteVisitor';
import { FootnoteReferenceNode } from './FootnoteReference';
import { MdastFootnoteDefinitionVisitor, MdastFootnoteReferenceVisitor } from './MdastFootnoteVisitor';

export const footnotePlugin = realmPlugin<{}>({
    init(realm, params) {
        realm.pubIn({
            [addImportVisitor$]: [MdastFootnoteDefinitionVisitor, MdastFootnoteReferenceVisitor],
            [addSyntaxExtension$]: [gfmFootnote()],
            [addMdastExtension$]: [gfmFootnoteFromMarkdown()],
            [addToMarkdownExtension$]: [gfmFootnoteToMarkdown()],
            [addLexicalNode$]: [FootnoteDefinitionNode, FootnoteReferenceNode],
            [addExportVisitor$]: [LexicalFootnoteDefinitionVisitor, LexicalFootnoteReferenceVisitor]
        });
    }
});
