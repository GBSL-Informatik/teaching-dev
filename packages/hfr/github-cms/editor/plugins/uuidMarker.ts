import type { Node } from 'prosemirror-model';
import { Plugin } from 'prosemirror-state';
import { Decoration, DecorationSet, type EditorView } from 'prosemirror-view';
import { createRegenerateButton, findUuids, isUuidV4, newUuid } from '../uuid';

const regenerate = (view: EditorView, from: number, to: number) => {
    if (!isUuidV4(view.state.doc.textBetween(from, to))) {
        return;
    }
    view.dispatch(view.state.tr.insertText(newUuid(), from, to));
};

/**
 * Highlights uuids in the text and adds a button to replace them with a new one.
 * Code-like nodes are edited with CodeMirror, which marks uuids itself (see `CodeMirrorNodeView`).
 */
const uuidDecorations = (doc: Node) => {
    const decorations: Decoration[] = [];
    doc.descendants((node, pos) => {
        if (node.type.spec.code) {
            return false;
        }
        if (!node.isText) {
            return true;
        }
        findUuids(node.text!).forEach(({ from, to }) => {
            const start = pos + from;
            const end = pos + to;
            decorations.push(Decoration.inline(start, end, { class: 'cms-uuid' }));
            decorations.push(
                Decoration.widget(end, (view) => createRegenerateButton(() => regenerate(view, start, end)), {
                    side: 1,
                    ignoreSelection: true,
                    stopEvent: () => true,
                    key: `uuid-${start}`
                })
            );
        });
        return false;
    });
    return DecorationSet.create(doc, decorations);
};

export const uuidMarker = () =>
    new Plugin<DecorationSet>({
        state: {
            init: (_, state) => uuidDecorations(state.doc),
            apply: (tr, decorations) => (tr.docChanged ? uuidDecorations(tr.doc) : decorations)
        },
        props: {
            decorations(state) {
                return this.getState(state);
            }
        }
    });
