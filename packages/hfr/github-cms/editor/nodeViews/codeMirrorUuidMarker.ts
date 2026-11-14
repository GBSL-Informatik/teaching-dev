import {
    Decoration,
    type DecorationSet,
    type EditorView,
    MatchDecorator,
    ViewPlugin,
    type ViewUpdate,
    WidgetType
} from '@codemirror/view';
import { createRegenerateButton, isUuidV4, newUuid, uuidV4Regex } from '../uuid';

const UUID_LENGTH = 36;

class RegenerateWidget extends WidgetType {
    eq() {
        return true;
    }

    toDOM(view: EditorView) {
        const button = createRegenerateButton(() => {
            const to = view.posAtDOM(button);
            const from = to - UUID_LENGTH;
            if (!isUuidV4(view.state.sliceDoc(from, to))) {
                return;
            }
            // changes are only forwarded to ProseMirror while CodeMirror has the focus
            view.focus();
            view.dispatch({ changes: { from, to, insert: newUuid() } });
        });
        return button;
    }

    ignoreEvent() {
        return true;
    }
}

const uuidMatcher = new MatchDecorator({
    regexp: uuidV4Regex(),
    decorate: (add, from, to) => {
        add(from, to, Decoration.mark({ class: 'cms-uuid' }));
        add(to, to, Decoration.widget({ widget: new RegenerateWidget(), side: 1 }));
    }
});

/**
 * Highlights uuids in code (e.g. the `page_id` in the frontmatter) and adds a button
 * to replace them with a new one.
 */
export const codeMirrorUuidMarker = ViewPlugin.fromClass(
    class {
        decorations: DecorationSet;

        constructor(view: EditorView) {
            this.decorations = uuidMatcher.createDeco(view);
        }

        update(update: ViewUpdate) {
            this.decorations = uuidMatcher.updateDeco(update, this.decorations);
        }
    },
    { decorations: (plugin) => plugin.decorations }
);
