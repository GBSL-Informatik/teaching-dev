// The actual plugin.
// The generic type parameter is used to specify the params accepted by the resulting function.

import { addComposerChild$, addNestedEditorChild$, realmPlugin } from '@mdxeditor/editor';
// import EmojiPickerPlugin from './EmojiPickerPlugin';
import MdiPickerPlugin from './MdiPickerPlugin';

// checkout https://github.com/facebook/lexical/blob/main/packages/lexical-playground/src/plugins/EmojiPickerPlugin/index.tsx#L91
// Those params are passed to the init/update functions.
const mdiCompletePlugin = realmPlugin({
    init(realm) {
        realm.pubIn({
            [addComposerChild$]: MdiPickerPlugin,
            [addNestedEditorChild$]: MdiPickerPlugin
        });
    },
    update(realm, params) {}
});

export default mdiCompletePlugin;
