/**
 * By Mdx Editor, @url https://github.com/mdx-editor/editor/tree/main/src/plugins/image
 */

import { addComposerChild$, realmPlugin, addNestedEditorChild$ } from '@mdxeditor/editor';
import DraggableBlockNode from './DraggableBlockNode';
export const draggableBlockPlugin = realmPlugin<{}>({
    init(realm) {
        realm.pubIn({
            [addComposerChild$]: () => <DraggableBlockNode />,
            [addNestedEditorChild$]: () => <DraggableBlockNode isNested />
        });
    }
});
