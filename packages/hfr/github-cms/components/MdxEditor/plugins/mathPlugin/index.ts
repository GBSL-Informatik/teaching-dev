/**
 * By Mdx Editor, @url https://github.com/mdx-editor/editor/tree/main/src/plugins/image
 */

import {
    addExportVisitor$,
    addImportVisitor$,
    addLexicalNode$,
    addMdastExtension$,
    addSyntaxExtension$,
    addToMarkdownExtension$,
    realmPlugin
} from '@mdxeditor/editor';
import { mathFromMarkdown, mathToMarkdown } from 'mdast-util-math';
import { math } from 'micromark-extension-math';
import { LexicalMathVisitor } from './LexicalMathVisitor';
import { MathNode } from './MathNode';
import { MdastInlineMathVisitor, MdastMathVisitor } from './MdastMathVisitor';

export const mathPlugin = realmPlugin<{}>({
    init(realm, params) {
        realm.pubIn({
            [addImportVisitor$]: [MdastMathVisitor, MdastInlineMathVisitor],
            [addSyntaxExtension$]: [math()],
            [addMdastExtension$]: [mathFromMarkdown()],
            [addToMarkdownExtension$]: [mathToMarkdown({ singleDollarTextMath: true })],
            [addLexicalNode$]: [MathNode],
            [addExportVisitor$]: [LexicalMathVisitor]
        });
    }
});
