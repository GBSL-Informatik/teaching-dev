import { debounce } from 'es-toolkit';
import { action, actionBound, observable, observableRef } from 'mobx';
import type { MarkType, NodeType } from 'prosemirror-model';
import { type Command, EditorState, type Transaction } from 'prosemirror-state';
import type { EditorView } from 'prosemirror-view';
import type { ReactPortal } from 'react';
import type File from '../../models/File';
import { parseMarkdown, serializeMarkdown } from '../markdown';
import { createPlugins } from '../plugins';

const SYNC_DELAY_MS = 300;

/**
 * The editing session of a markdown file.
 *
 * The ProseMirror state is kept as an observable reference: every transaction replaces it,
 * so toolbar buttons and node views simply observe the parts of the state they need.
 * Changes are written back to the file (debounced) as markdown.
 */
class MdxDocument {
    readonly file: File;
    @observableRef accessor state: EditorState;
    @observableRef accessor view: EditorView | null = null;
    /** shows the changes of the markdown source instead of the editor */
    @observable accessor showDiff = false;

    /** React content of the node views, rendered as portals by the editor component */
    readonly portals = observable.map<string, ReactPortal>({}, { deep: false });

    private readonly trailing: string;

    /**
     * @throws when the content of the file is not valid mdx
     */
    constructor(file: File) {
        this.file = file;
        const { doc, trailing } = parseMarkdown(file.content);
        this.trailing = trailing;
        this.state = EditorState.create({ doc, plugins: createPlugins() });
    }

    @action
    setShowDiff(showDiff: boolean) {
        if (showDiff) {
            this.flush();
        }
        this.showDiff = showDiff;
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
}

export default MdxDocument;
