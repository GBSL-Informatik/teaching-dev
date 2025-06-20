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
import type { Parent, PhrasingContent, Root } from 'mdast';
import { MdastKbdVisitor } from './MdastKbdVisitor';
import { $isKbdNode, $toggleKbd, KbdNode, TOGGLE_KBD_COMMAND } from './KbdNode';
import { LexicalKbdVisitor } from './LexicalKbdVisitor';
import { COMMAND_PRIORITY_LOW, type LexicalEditor } from 'lexical';
import handleFocusNextInline from '@tdev-components/Cms/MdxEditor/helpers/lexical/handle-focus-next-inline';
import handleFocusPreviousInline from '@tdev-components/Cms/MdxEditor/helpers/lexical/handle-focus-previous-inline';

export interface Kbd extends Parent {
    type: 'kbd';
    children: PhrasingContent[];
}
declare module 'mdast' {
    interface RootContentMap {
        kbd: Kbd;
    }
}

export const kbdPlugin = realmPlugin<{}>({
    init(realm, params) {
        realm.pubIn({
            [addImportVisitor$]: [MdastKbdVisitor],
            [addLexicalNode$]: KbdNode,
            [addExportVisitor$]: [LexicalKbdVisitor],
            [addMdastExtension$]: [
                {
                    name: 'kbd-plugin',
                    transforms: [
                        (ast: Root) => {
                            transformer(ast, (children) => ({ type: 'kbd', children: children }));
                        }
                    ]
                }
            ],
            [createRootEditorSubscription$]: [
                (editor: LexicalEditor) => {
                    return editor.registerCommand<boolean | null>(
                        TOGGLE_KBD_COMMAND,
                        (payload, currentEditor) => {
                            currentEditor.update(() => {
                                $toggleKbd(payload === null ? true : !!payload);
                            });
                            return true;
                        },
                        COMMAND_PRIORITY_LOW
                    );
                },
                handleFocusNextInline($isKbdNode),
                handleFocusPreviousInline($isKbdNode)
            ]
        });
    }
});
