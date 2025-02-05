/**
 * By Mdx Editor, @url https://github.com/mdx-editor/editor/tree/main/src/plugins/image
 */

import {
    addExportVisitor$,
    addImportVisitor$,
    addLexicalNode$,
    addMdastExtension$,
    createRootEditorSubscription$,
    realmPlugin
} from '@mdxeditor/editor';
import { transformer } from '../plugin';
import { Parent, PhrasingContent, Root, Nodes } from 'mdast';
import { MdastKbdVisitor } from './MdastKbdVisitor';
import { $toggleKbd, KbdNode, TOGGLE_KBD_COMMAND } from './KbdNode';
import { LexicalKbdVisitor } from './LexicalKbdVisitor';
import { COMMAND_PRIORITY_LOW, type LexicalEditor } from 'lexical';

declare module 'mdast' {
    interface RootContentMap {
        kbd: Kbd;
    }
}
export interface Kbd extends Parent {
    type: 'kbd';
    children: PhrasingContent[];
}
/**
 * A plugin that adds support for images.
 * @group Image
 */
export const kbdPlugin = realmPlugin<{}>({
    init(realm, params) {
        realm.pubIn({
            [addImportVisitor$]: [MdastKbdVisitor],
            [addLexicalNode$]: KbdNode,
            [addExportVisitor$]: [LexicalKbdVisitor],
            [addMdastExtension$]: [
                {
                    transforms: [
                        (ast: Root) => {
                            transformer(ast, (children) => ({ type: 'kbd', children: children }));
                        }
                    ]
                }
            ],
            [createRootEditorSubscription$]: (editor: LexicalEditor) => {
                return editor.registerCommand<KeyboardEvent>(
                    TOGGLE_KBD_COMMAND,
                    (payload) => {
                        $toggleKbd(payload === null ? true : !!payload);
                        return true;
                    },
                    COMMAND_PRIORITY_LOW
                );
            }
        });
    }
});
