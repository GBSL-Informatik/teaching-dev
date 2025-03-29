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
import { LexicalEditor, COMMAND_PRIORITY_LOW } from 'lexical';
import { MdastBoxVisitor } from './MdastBoxVisitor';
import { $isBoxNode, $toggleBoxed, BoxNode, TOGGLE_BOX_COMMAND } from './BoxNode';
import { LexicalBoxVisitor } from './LexicalBoxVisitor';
import { Parent, PhrasingContent, Root, Nodes } from 'mdast';
import { transformer } from '../plugin';
import { rootStore } from '@tdev/stores/rootStore';
import handleFocusNextInline from '@tdev-components/Cms/MdxEditor/helpers/lexical/handle-focus-next-inline';
import handleFocusPreviousInline from '@tdev-components/Cms/MdxEditor/helpers/lexical/handle-focus-previous-inline';

export interface Box extends Parent {
    type: 'box';
    children: PhrasingContent[];
}
declare module 'mdast' {
    interface RootContentMap {
        box: Box;
    }
}
/**
 * A plugin that adds support for images.
 * @group Image
 */
export const strongPlugin = realmPlugin<{}>({
    init(realm, params) {
        realm.pubIn({
            [addImportVisitor$]: [MdastBoxVisitor],
            [addLexicalNode$]: BoxNode,
            [addExportVisitor$]: [LexicalBoxVisitor],
            [addMdastExtension$]: [
                {
                    name: 'strong-plugin',
                    transforms: [
                        (ast: Root) => {
                            const { cmsStore } = rootStore;
                            const content =
                                cmsStore.activeEntry?.type === 'file' ? cmsStore.activeEntry.content : '';
                            transformer(ast, content, (children) => ({ type: 'box', children: children }));
                        }
                    ]
                }
            ],
            [createRootEditorSubscription$]: [
                (editor: LexicalEditor) => {
                    return editor.registerCommand<boolean | null>(
                        TOGGLE_BOX_COMMAND,
                        (payload) => {
                            $toggleBoxed(payload === null ? true : !!payload);
                            return true;
                        },
                        COMMAND_PRIORITY_LOW
                    );
                },
                handleFocusNextInline($isBoxNode),
                handleFocusPreviousInline($isBoxNode)
            ]
        });
    }
});
