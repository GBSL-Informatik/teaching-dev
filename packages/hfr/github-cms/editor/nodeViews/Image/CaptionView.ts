import { baseKeymap, toggleMark } from 'prosemirror-commands';
import { history, redo, undo } from 'prosemirror-history';
import { InputRule, inputRules } from 'prosemirror-inputrules';
import { keymap } from 'prosemirror-keymap';
import { EditorState, type Transaction } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import type { ReactPortal } from 'react';
import { parseCaption, serializeCaption } from '../../markdown/caption';
import { captionSchema } from '../../schema/caption';
import InlineAtom from '../InlineAtom';
import InlineMath from '../InlineMath';
import { type NodeViewEditor, reactNodeView } from '../ReactNodeView';
import TextDirective from '../TextDirective';

const { marks, nodes } = captionSchema;

/** captions are a single line: line breaks and new paragraphs are ignored */
const ignore = () => true;

/** typing `:mdi[robot]` inserts the icon */
const mdiIconRule = new InputRule(/:mdi\[([\w-]+)\]$/, (state, match, start, end) => {
    return state.tr.replaceWith(start, end, nodes.text_directive.create({ name: 'mdi', label: match[1] }));
});

const createPlugins = () => [
    inputRules({ rules: [mdiIconRule] }),
    history(),
    keymap({
        'Mod-z': undo,
        'Shift-Mod-z': redo,
        'Mod-y': redo,
        'Mod-b': toggleMark(marks.strong),
        'Mod-i': toggleMark(marks.emphasis),
        'Mod-e': toggleMark(marks.code),
        'Mod-u': toggleMark(marks.box),
        'Mod-k': toggleMark(marks.kbd),
        Enter: ignore,
        'Shift-Enter': ignore,
        'Mod-Enter': ignore
    }),
    keymap(baseKeymap)
];

/**
 * A nested ProseMirror editor for the caption of an image, written as markdown to the alt text.
 * Inline nodes (e.g. icons) use the node views of the document.
 *
 * @see https://prosemirror.net/examples/footnote/
 */
export class CaptionView implements NodeViewEditor {
    readonly view: EditorView;
    private readonly document: NodeViewEditor;
    private readonly onChange: (markdown: string) => void;
    private markdown: string;

    /**
     * @param document renders the React content of the node views
     */
    constructor(
        mount: HTMLElement,
        markdown: string,
        document: NodeViewEditor,
        onChange: (markdown: string) => void
    ) {
        this.markdown = markdown;
        this.document = document;
        this.onChange = onChange;
        this.view = new EditorView(
            { mount },
            {
                state: this.createState(markdown),
                dispatchTransaction: this.dispatch,
                nodeViews: {
                    text_directive: reactNodeView(this, { component: TextDirective }),
                    math_inline: reactNodeView(this, { component: InlineMath }),
                    footnote_reference: reactNodeView(this, { component: InlineAtom }),
                    raw_inline: reactNodeView(this, { component: InlineAtom })
                },
                attributes: { class: 'cms-caption-editor' }
            }
        );
        this.view.dom.addEventListener('pointerdown', this.handlePointerDown);
    }

    get state() {
        return this.view.state;
    }

    readonly dispatch = (tr: Transaction) => {
        const state = this.view.state.apply(tr);
        this.view.updateState(state);
        if (!tr.docChanged) {
            return;
        }
        this.markdown = serializeCaption(state.doc);
        this.onChange(this.markdown);
    };

    addPortal(key: string, portal: ReactPortal) {
        this.document.addPortal(key, portal);
    }

    removePortal(key: string) {
        this.document.removePortal(key);
    }

    /** updates the caption when it was changed outside of this editor, e.g. by undo */
    setMarkdown(markdown: string) {
        if (markdown === this.markdown) {
            return;
        }
        this.markdown = markdown;
        this.view.updateState(this.createState(markdown));
    }

    destroy() {
        this.view.dom.removeEventListener('pointerdown', this.handlePointerDown);
        this.view.destroy();
    }

    private createState(markdown: string) {
        return EditorState.create({ doc: parseCaption(markdown), plugins: createPlugins() });
    }

    /**
     * The image node is draggable: while the pointer is down, text in the caption is selected
     * instead of dragging the image.
     */
    private readonly handlePointerDown = () => {
        const draggable = this.view.dom.closest<HTMLElement>('[draggable="true"]');
        if (!draggable) {
            return;
        }
        draggable.draggable = false;
        window.addEventListener('pointerup', () => (draggable.draggable = true), { once: true });
    };
}
