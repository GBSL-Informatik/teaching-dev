import { debounce } from 'es-toolkit';
import { action, actionBound, observable, observableRef } from 'mobx';
import type { MarkType, NodeType } from 'prosemirror-model';
import { type Command, EditorState, type Transaction } from 'prosemirror-state';
import type { EditorView } from 'prosemirror-view';
import type { ReactPortal } from 'react';
import { Asset } from '../../models/Dir';
import type File from '../../models/File';
import { insertInline, insertInlineAt } from '../commands';
import { parseMarkdown, serializeMarkdown } from '../markdown';
import type { NodeViewEditor } from '../nodeViews/ReactNodeView';
import { createPlugins } from '../plugins';
import { schema } from '../schema';

const SYNC_DELAY_MS = 300;

interface NewDrawing {
    /** the path of the image in the repository, e.g. `docs/images/sketch.webp` */
    path: string;
    mimeType: string;
}

/**
 * @throws when the content is not valid mdx
 */
const parseDocument = (content: string, document: MdxDocument) => {
    const { doc, trailing } = parseMarkdown(content);
    return { state: EditorState.create({ doc, plugins: createPlugins(document) }), trailing };
};

/**
 * The editing session of a markdown file.
 *
 * The ProseMirror state is kept as an observable reference: every transaction replaces it,
 * so toolbar buttons and node views simply observe the parts of the state they need.
 * Changes are written back to the file (debounced) as markdown.
 */
class MdxDocument implements NodeViewEditor {
    readonly file: File;
    @observableRef accessor state: EditorState;
    @observableRef accessor view: EditorView | null = null;
    /** shows the changes of the markdown source instead of the editor */
    @observable accessor showDiff = false;
    /** the dialog to insert an image, opened from the insert menu or the suggestions */
    @observable accessor isImageDialogOpen = false;
    /** an image dropped or pasted into the editor, it is inserted at `pos` once it is named and uploaded */
    @observableRef accessor imageToUpload: { file: globalThis.File; pos: number } | null = null;
    /** a new excalidraw drawing, the image is created in the repository when the drawing is saved */
    @observableRef accessor newDrawing: NewDrawing | null = null;

    /** React content of the node views, rendered as portals by the editor component */
    readonly portals = observable.map<string, ReactPortal>({}, { deep: false });

    private trailing: string;

    /**
     * @throws when the content of the file is not valid mdx
     */
    constructor(file: File) {
        this.file = file;
        const { state, trailing } = parseDocument(file.content, this);
        this.state = state;
        this.trailing = trailing;
    }

    @action
    setShowDiff(showDiff: boolean) {
        if (showDiff) {
            this.flush();
        } else {
            this.reloadRevertedChanges();
        }
        this.showDiff = showDiff;
    }

    @action
    setImageDialogOpen(open: boolean) {
        this.isImageDialogOpen = open;
    }

    @action
    setImageToUpload(imageToUpload: { file: globalThis.File; pos: number } | null) {
        this.imageToUpload = imageToUpload;
    }

    @action
    insertUploadedImage(src: string) {
        if (!this.imageToUpload) {
            return;
        }
        const { pos } = this.imageToUpload;
        this.imageToUpload = null;
        this.run(insertInlineAt(pos, schema.nodes.image.create({ src })));
    }

    /**
     * Opens the excalidraw editor for a new image in `./images`.
     * @returns false when an image with this name exists already
     */
    @action
    startNewDrawing(fileName: string, mimeType: string) {
        if (this.file.images.some((image) => image.name === fileName)) {
            return false;
        }
        this.newDrawing = { path: `${this.file.imageDirPath}/${fileName}`, mimeType };
        return true;
    }

    @action
    setNewDrawing(newDrawing: NewDrawing | null) {
        this.newDrawing = newDrawing;
    }

    /** inserts the saved drawing at the cursor, where the drawing was started */
    @action
    insertNewDrawing(imagePath: string) {
        const fileName = imagePath.split('/').pop()!;
        this.run(insertInline(schema.nodes.image.create({ src: `./${Asset.IMAGE}/${fileName}` })));
    }

    @action
    setView(view: EditorView | null) {
        this.view = view;
    }

    @actionBound
    dispatch(tr: Transaction) {
        this.state = this.state.apply(tr);
        this.view?.updateState(this.state);
        if (tr.docChanged) {
            this.syncToFile();
        }
    }

    /**
     * Runs a ProseMirror command against the current state and focuses the editor.
     */
    run(command: Command) {
        const done = command(this.state, this.dispatch, this.view ?? undefined);
        this.view?.focus();
        return done;
    }

    /** whether the command can be applied to the current state - observes the state */
    canRun(command: Command) {
        return command(this.state);
    }

    /** whether the mark is active at the current selection - observes the state */
    isMarkActive(type: MarkType) {
        const { from, $from, to, empty } = this.state.selection;
        if (empty) {
            return !!type.isInSet(this.state.storedMarks || $from.marks());
        }
        return this.state.doc.rangeHasMark(from, to, type);
    }

    /** whether the selection is inside a node of the given type - observes the state */
    isInside(type: NodeType) {
        const { $from } = this.state.selection;
        for (let depth = $from.depth; depth > 0; depth--) {
            if ($from.node(depth).type === type) {
                return true;
            }
        }
        return false;
    }

    get markdown() {
        return serializeMarkdown(this.state.doc, this.trailing);
    }

    private syncToFile = debounce(
        action(() => this.file.setContent(this.markdown)),
        SYNC_DELAY_MS
    );

    /**
     * writes pending changes to the file immediately
     */
    flush() {
        this.syncToFile.flush();
    }

    @action
    addPortal(key: string, portal: ReactPortal) {
        this.portals.set(key, portal);
    }

    @action
    removePortal(key: string) {
        this.portals.delete(key);
    }

    /**
     * Changes reverted in the diff are only written to the file: the document is parsed again.
     * When the result is not valid mdx (e.g. half of a component was reverted), the source editor is shown.
     */
    @action
    private reloadRevertedChanges() {
        if (this.file.content === this.markdown) {
            return;
        }
        try {
            const { state, trailing } = parseDocument(this.file.content, this);
            this.state = state;
            this.trailing = trailing;
            this.view?.updateState(this.state);
        } catch (error) {
            this.file.showSource(error instanceof Error ? error.message : String(error));
        }
    }
}

export default MdxDocument;
