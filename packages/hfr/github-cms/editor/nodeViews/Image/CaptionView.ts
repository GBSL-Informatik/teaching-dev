import { baseKeymap, toggleMark } from 'prosemirror-commands';
import { history, redo, undo } from 'prosemirror-history';
import { keymap } from 'prosemirror-keymap';
import { EditorState, type Transaction } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { parseCaption, serializeCaption } from '../../markdown/caption';
import { captionSchema } from '../../schema/caption';

const { marks } = captionSchema;

/** captions are a single line: line breaks and new paragraphs are ignored */
const ignore = () => true;

const createPlugins = () => [
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
 *
 * @see https://prosemirror.net/examples/footnote/
 */
export class CaptionView {
    private readonly view: EditorView;
    private readonly onChange: (markdown: string) => void;
    private markdown: string;

    constructor(mount: HTMLElement, markdown: string, onChange: (markdown: string) => void) {
        this.markdown = markdown;
        this.onChange = onChange;
        this.view = new EditorView(
            { mount },
            {
                state: this.createState(markdown),
                dispatchTransaction: (tr) => this.dispatch(tr),
                attributes: { class: 'cms-caption-editor' }
            }
        );
        this.view.dom.addEventListener('pointerdown', this.handlePointerDown);
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

    private dispatch(tr: Transaction) {
        const state = this.view.state.apply(tr);
        this.view.updateState(state);
        if (!tr.docChanged) {
            return;
        }
        this.markdown = serializeCaption(state.doc);
        this.onChange(this.markdown);
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
