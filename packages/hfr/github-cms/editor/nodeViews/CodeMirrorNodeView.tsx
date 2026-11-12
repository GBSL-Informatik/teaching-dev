import { defaultKeymap } from '@codemirror/commands';
import { defaultHighlightStyle, LanguageDescription, syntaxHighlighting } from '@codemirror/language';
import { languages } from '@codemirror/language-data';
import { Compartment } from '@codemirror/state';
import {
    EditorView as CodeMirror,
    keymap as codeMirrorKeymap,
    drawSelection,
    type KeyBinding,
    type ViewUpdate
} from '@codemirror/view';
import { exitCode } from 'prosemirror-commands';
import { redo, undo } from 'prosemirror-history';
import type { Node } from 'prosemirror-model';
import { type Command, Selection, TextSelection } from 'prosemirror-state';
import type { EditorView, NodeView, NodeViewConstructor } from 'prosemirror-view';
import React from 'react';
import { createPortal } from 'react-dom';
import { codeMirrorIndentation } from '../codeMirrorIndentation';
import type MdxDocument from '../models/MdxDocument';
import { codeMirrorUuidMarker } from './codeMirrorUuidMarker';
import { NodeViewHandle, type NodeViewProps } from './ReactNodeView';

interface Options {
    /** the language name or file extension used for syntax highlighting */
    language: (node: Node) => string;
    /** rendered above the code, e.g. to select the language */
    header?: React.ComponentType<NodeViewProps>;
    /** rendered below the code, e.g. a preview */
    footer?: React.ComponentType<NodeViewProps>;
    className?: (node: Node) => string;
}

let portalCounter = 0;

/**
 * Edits code-like nodes (code blocks, math, frontmatter, raw mdx) with CodeMirror.
 * Changes are forwarded to ProseMirror, so the undo history and the document stay in ProseMirror.
 *
 * @see https://prosemirror.net/examples/codemirror/
 */
class CodeMirrorNodeView implements NodeView {
    readonly dom: HTMLElement;
    private readonly view: EditorView;
    private readonly getPos: () => number | undefined;
    private readonly document: MdxDocument;
    private readonly options: Options;
    private readonly codeMirror: CodeMirror;
    private readonly languageConf = new Compartment();
    private readonly handle: NodeViewHandle;
    private readonly portalKeys: string[] = [];
    private node: Node;
    private language = '';
    /** set while changes from ProseMirror are applied to CodeMirror, to avoid forwarding them back */
    private updating = false;

    constructor(
        node: Node,
        view: EditorView,
        getPos: () => number | undefined,
        document: MdxDocument,
        options: Options
    ) {
        this.view = view;
        this.getPos = getPos;
        this.document = document;
        this.options = options;
        this.node = node;
        this.handle = new NodeViewHandle(node, document, getPos);
        this.codeMirror = new CodeMirror({
            doc: node.textContent,
            extensions: [
                codeMirrorKeymap.of([...this.keymap(), ...defaultKeymap]),
                codeMirrorIndentation,
                drawSelection(),
                syntaxHighlighting(defaultHighlightStyle),
                CodeMirror.lineWrapping,
                codeMirrorUuidMarker,
                this.languageConf.of([]),
                CodeMirror.updateListener.of((update) => this.forwardUpdate(update))
            ]
        });
        this.dom = window.document.createElement('div');
        this.updateClassName();
        this.addComponent(options.header);
        this.dom.appendChild(this.codeMirror.dom);
        this.addComponent(options.footer);
        this.loadLanguage();
    }

    update(node: Node) {
        if (node.type !== this.node.type) {
            return false;
        }
        this.node = node;
        this.handle.setNode(node);
        this.updateClassName();
        this.loadLanguage();
        if (this.updating) {
            return true;
        }
        const newText = node.textContent;
        const currentText = this.codeMirror.state.doc.toString();
        if (newText === currentText) {
            return true;
        }
        this.replaceChangedText(currentText, newText);
        return true;
    }

    setSelection(anchor: number, head: number) {
        this.codeMirror.focus();
        this.updating = true;
        this.codeMirror.dispatch({ selection: { anchor, head } });
        this.updating = false;
    }

    /** e.g. a click on the header: the code block is selected as a whole, to copy or cut it */
    selectNode() {
        this.handle.setSelected(true);
        this.updateClassName();
    }

    deselectNode() {
        this.handle.setSelected(false);
        this.updateClassName();
    }

    /**
     * CodeMirror and the interactive elements of the header and footer handle their events themselves,
     * other events (e.g. copying the selected code block) are handled by ProseMirror.
     */
    stopEvent(event: Event) {
        // a block dragged in ProseMirror is dropped by ProseMirror, see `plugins/dropTargets.ts`
        if (event instanceof DragEvent && this.view.dragging) {
            return false;
        }
        const target = event.target;
        if (!(target instanceof HTMLElement)) {
            return false;
        }
        if (this.codeMirror.dom.contains(target)) {
            return true;
        }
        const interactive = target.closest('input, textarea, select, button, [data-stop-event]');
        return !!interactive && this.dom.contains(interactive);
    }

    destroy() {
        this.codeMirror.destroy();
        this.portalKeys.forEach((key) => this.document.removePortal(key));
    }

    private addComponent(Component?: React.ComponentType<NodeViewProps>) {
        if (!Component) {
            return;
        }
        const container = window.document.createElement('div');
        container.contentEditable = 'false';
        this.dom.appendChild(container);
        const key = `code-node-view-${portalCounter++}`;
        this.portalKeys.push(key);
        this.document.addPortal(key, createPortal(<Component handle={this.handle} />, container, key));
    }

    private updateClassName() {
        const selected = this.handle.selected ? 'ProseMirror-selectednode' : '';
        this.dom.className = `cms-code-node ${this.options.className?.(this.node) ?? ''} ${selected}`;
    }

    private async loadLanguage() {
        const language = this.options.language(this.node);
        if (language === this.language) {
            return;
        }
        this.language = language;
        const description =
            LanguageDescription.matchLanguageName(languages, language, true) ??
            LanguageDescription.matchFilename(languages, `file.${language}`);
        const support = description ? await description.load() : [];
        this.codeMirror.dispatch({ effects: this.languageConf.reconfigure(support) });
    }

    private forwardUpdate(update: ViewUpdate) {
        const pos = this.getPos();
        if (this.updating || !this.codeMirror.hasFocus || pos === undefined) {
            return;
        }
        let offset = pos + 1;
        const { main } = update.state.selection;
        const selectionFrom = offset + main.from;
        const selectionTo = offset + main.to;
        const current = this.view.state.selection;
        if (!update.docChanged && current.from === selectionFrom && current.to === selectionTo) {
            return;
        }
        const tr = this.view.state.tr;
        update.changes.iterChanges((fromA, toA, fromB, toB, text) => {
            if (text.length) {
                tr.replaceWith(offset + fromA, offset + toA, this.view.state.schema.text(text.toString()));
            } else {
                tr.delete(offset + fromA, offset + toA);
            }
            offset += toB - fromB - (toA - fromA);
        });
        tr.setSelection(TextSelection.create(tr.doc, selectionFrom, selectionTo));
        this.view.dispatch(tr);
    }

    /**
     * Applies a change from ProseMirror to CodeMirror. Only the changed range is replaced,
     * so the cursor in CodeMirror stays where it is.
     */
    private replaceChangedText(currentText: string, newText: string) {
        let start = 0;
        let currentEnd = currentText.length;
        let newEnd = newText.length;
        while (start < currentEnd && currentText.charCodeAt(start) === newText.charCodeAt(start)) {
            start++;
        }
        while (
            currentEnd > start &&
            newEnd > start &&
            currentText.charCodeAt(currentEnd - 1) === newText.charCodeAt(newEnd - 1)
        ) {
            currentEnd--;
            newEnd--;
        }
        this.updating = true;
        this.codeMirror.dispatch({
            changes: { from: start, to: currentEnd, insert: newText.slice(start, newEnd) }
        });
        this.updating = false;
    }

    private keymap(): KeyBinding[] {
        const run = (command: Command) => () => command(this.view.state, this.view.dispatch, this.view);
        return [
            { key: 'ArrowUp', run: () => this.maybeEscape('line', -1) },
            { key: 'ArrowLeft', run: () => this.maybeEscape('char', -1) },
            { key: 'ArrowDown', run: () => this.maybeEscape('line', 1) },
            { key: 'ArrowRight', run: () => this.maybeEscape('char', 1) },
            {
                // continues after the code block, like Mod-Enter after directives
                key: 'Mod-Enter',
                run: () => {
                    if (!exitCode(this.view.state, this.view.dispatch)) {
                        return false;
                    }
                    this.view.focus();
                    return true;
                }
            },
            { key: 'Mod-z', run: run(undo) },
            { key: 'Shift-Mod-z', run: run(redo) },
            { key: 'Mod-y', run: run(redo) }
        ];
    }

    /**
     * Moves the cursor out of CodeMirror when it is at the start or end of the code.
     */
    private maybeEscape(unit: 'line' | 'char', direction: -1 | 1) {
        const { state } = this.codeMirror;
        const pos = this.getPos();
        let range: { from: number; to: number } = state.selection.main;
        if (!state.selection.main.empty || pos === undefined) {
            return false;
        }
        if (unit === 'line') {
            range = state.doc.lineAt(state.selection.main.head);
        }
        if (direction < 0 ? range.from > 0 : range.to < state.doc.length) {
            return false;
        }
        const target = pos + (direction < 0 ? 0 : this.node.nodeSize);
        const selection = Selection.near(this.view.state.doc.resolve(target), direction);
        this.view.dispatch(this.view.state.tr.setSelection(selection).scrollIntoView());
        this.view.focus();
        return true;
    }
}

export const codeMirrorNodeView = (document: MdxDocument, options: Options): NodeViewConstructor => {
    return (node, view, getPos) => new CodeMirrorNodeView(node, view, getPos, document, options);
};

/**
 * Moves the cursor into an adjacent code node when using the arrow keys.
 */
export const arrowIntoCode = (direction: 'left' | 'right' | 'up' | 'down'): Command => {
    return (state, dispatch, view) => {
        if (!state.selection.empty || !view?.endOfTextblock(direction)) {
            return false;
        }
        const side = direction === 'left' || direction === 'up' ? -1 : 1;
        const { $head } = state.selection;
        // e.g. a gap cursor between top-level blocks, which has no block to step out of
        if ($head.depth === 0) {
            return false;
        }
        const next = Selection.near(state.doc.resolve(side > 0 ? $head.after() : $head.before()), side);
        if (!next.$head?.parent.type.spec.code) {
            return false;
        }
        dispatch?.(state.tr.setSelection(next));
        return true;
    };
};
