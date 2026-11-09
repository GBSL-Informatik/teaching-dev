import {
    type Command,
    type EditorState,
    Plugin,
    PluginKey,
    TextSelection,
    type Transaction
} from 'prosemirror-state';
import { Mapping } from 'prosemirror-transform';
import type { EditorView } from 'prosemirror-view';
import type { Suggestion, SuggestionSource } from '../suggestions';

/** the typed text a source offers suggestions for, e.g. `/tip` */
export interface TypedQuery {
    source: SuggestionSource;
    from: number;
    to: number;
    /** the typed text without its trigger, e.g. `tip` of `/tip` */
    query: string;
}

interface SuggestionMenuState {
    /** null while the menu is closed */
    typed: TypedQuery | null;
    selectedIndex: number;
    /** where the typed text of a menu closed with escape starts, it stays closed until the text is removed */
    dismissedFrom: number | null;
}

type SuggestionMenuMeta = { type: 'select'; index: number } | { type: 'dismiss' };

const CLOSED: SuggestionMenuState = { typed: null, selectedIndex: 0, dismissedFrom: null };

export const suggestionMenuKey = new PluginKey<SuggestionMenuState>('suggestionMenu');

/**
 * Typing e.g. `/` or `:::` opens a menu of suggestions, filtered by the text typed after it.
 * The first source matching the typed text offers its suggestions.
 * The menu is rendered by the `SuggestionMenu` component.
 */
export const suggestionMenu = (sources: SuggestionSource[]) => {
    return new Plugin<SuggestionMenuState>({
        key: suggestionMenuKey,
        state: {
            init: () => CLOSED,
            apply: (tr, previous, _oldState, newState) => {
                const typed = findTypedQuery(newState, sources);
                if (!typed) {
                    return CLOSED;
                }
                const meta: SuggestionMenuMeta | undefined = tr.getMeta(suggestionMenuKey);
                if (meta?.type === 'dismiss') {
                    return { typed: null, selectedIndex: 0, dismissedFrom: typed.from };
                }
                const dismissedFrom =
                    previous.dismissedFrom === null ? null : tr.mapping.map(previous.dismissedFrom);
                if (dismissedFrom === typed.from) {
                    return { typed: null, selectedIndex: 0, dismissedFrom };
                }
                if (meta?.type === 'select') {
                    return { typed, selectedIndex: meta.index, dismissedFrom: null };
                }
                const isSameQuery =
                    previous.typed?.source === typed.source && previous.typed.query === typed.query;
                return {
                    typed,
                    selectedIndex: isSameQuery ? previous.selectedIndex : 0,
                    dismissedFrom: null
                };
            }
        },
        props: {
            handleKeyDown: handleMenuKey
        }
    });
};

/**
 * The suggestions offered for the typed text. They are checked against the document
 * without the typed text, since it is removed before a suggestion is applied.
 */
export const availableSuggestions = (state: EditorState, typed: TypedQuery): Suggestion[] => {
    const stateWithoutTyped = state.apply(state.tr.delete(typed.from, typed.to));
    return typed.source.suggestions(stateWithoutTyped, typed.query);
};

/** the selected index is not clamped when the list gets shorter while typing */
export const selectedSuggestionIndex = (selectedIndex: number, suggestionCount: number) => {
    return Math.min(selectedIndex, suggestionCount - 1);
};

/**
 * Removes the typed text and applies the suggestion in a single transaction,
 * so that undo restores the typed text in one step.
 */
export const applySuggestion = (typed: TypedQuery, suggestion: Suggestion): Command => {
    return (state, dispatch) => {
        const tr = state.tr.delete(typed.from, typed.to);
        let suggestionTr: Transaction | undefined;
        const isApplied = suggestion.command(state.apply(tr), (applied) => (suggestionTr = applied));
        if (!isApplied || !dispatch) {
            return isApplied;
        }

        // e.g. opening a dialog does not change the document, only the typed text is removed
        if (suggestionTr) {
            // the suggestion was applied to the state without the typed text, which is `tr.doc`
            suggestionTr.steps.forEach((step) => tr.step(step));
            tr.setSelection(suggestionTr.selection.map(tr.doc, new Mapping()));
        }
        dispatch(tr.scrollIntoView());
        return true;
    };
};

const handleMenuKey = (view: EditorView, event: KeyboardEvent): boolean => {
    const menu = suggestionMenuKey.getState(view.state);
    if (!menu?.typed) {
        return false;
    }
    const suggestions = availableSuggestions(view.state, menu.typed);
    if (suggestions.length === 0) {
        return false;
    }
    const selectedIndex = selectedSuggestionIndex(menu.selectedIndex, suggestions.length);
    const dispatchMeta = (meta: SuggestionMenuMeta) => {
        view.dispatch(view.state.tr.setMeta(suggestionMenuKey, meta));
    };
    const select = (index: number) => {
        dispatchMeta({ type: 'select', index: (index + suggestions.length) % suggestions.length });
    };
    switch (event.key) {
        case 'Escape':
            dispatchMeta({ type: 'dismiss' });
            return true;
        case 'ArrowDown':
            select(selectedIndex + 1);
            return true;
        case 'ArrowUp':
            select(selectedIndex - 1);
            return true;
        case 'Enter':
        case 'Tab':
            applySuggestion(menu.typed, suggestions[selectedIndex])(view.state, view.dispatch, view);
            return true;
        default:
            return false;
    }
};

const findTypedQuery = (state: EditorState, sources: SuggestionSource[]): TypedQuery | null => {
    const $cursor = state.selection instanceof TextSelection ? state.selection.$cursor : null;
    if (!$cursor || $cursor.parent.type.spec.code || $cursor.marks().some((mark) => mark.type.spec.code)) {
        return null;
    }
    const textBefore = $cursor.parent.textBetween(0, $cursor.parentOffset, undefined, '￼');
    for (const source of sources) {
        const match = source.pattern.exec(textBefore);
        if (match) {
            return { source, from: $cursor.pos - match[0].length, to: $cursor.pos, query: match[1] };
        }
    }
    return null;
};
