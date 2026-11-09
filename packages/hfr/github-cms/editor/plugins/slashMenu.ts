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
import { matchingQuickActions, type QuickAction } from '../quickActions';

/** the typed `/query`, `from` is the position of the slash */
export interface SlashQuery {
    from: number;
    to: number;
    query: string;
}

interface SlashMenuState {
    /** null while the menu is closed */
    query: SlashQuery | null;
    selectedIndex: number;
    /** the slash position of a menu closed with escape, it stays closed until the query is removed */
    dismissedFrom: number | null;
}

type SlashMenuMeta = { type: 'select'; index: number } | { type: 'dismiss' };

const CLOSED: SlashMenuState = { query: null, selectedIndex: 0, dismissedFrom: null };

/** a slash at the start of the text or after a space, followed by the query, e.g. `/tip` */
const SLASH_QUERY = /(?:^|\s)\/([^\s/]{0,30})$/;

export const slashMenuKey = new PluginKey<SlashMenuState>('slashMenu');

/**
 * Typing `/` opens a menu of quick actions, filtered by the text typed after the slash.
 * The menu is rendered by the `SlashMenu` component.
 */
export const slashMenu = () => {
    return new Plugin<SlashMenuState>({
        key: slashMenuKey,
        state: {
            init: () => CLOSED,
            apply: (tr, previous, _oldState, newState) => {
                const query = findSlashQuery(newState);
                if (!query) {
                    return CLOSED;
                }
                const meta: SlashMenuMeta | undefined = tr.getMeta(slashMenuKey);
                if (meta?.type === 'dismiss') {
                    return { query: null, selectedIndex: 0, dismissedFrom: query.from };
                }
                const dismissedFrom =
                    previous.dismissedFrom === null ? null : tr.mapping.map(previous.dismissedFrom);
                if (dismissedFrom === query.from) {
                    return { query: null, selectedIndex: 0, dismissedFrom };
                }
                if (meta?.type === 'select') {
                    return { query, selectedIndex: meta.index, dismissedFrom: null };
                }
                const isSameQuery = previous.query?.query === query.query;
                return {
                    query,
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
 * The quick actions offered for the query. They are checked against the document
 * without the `/query`, since it is removed before an action is applied.
 */
export const availableQuickActions = (state: EditorState, query: SlashQuery): QuickAction[] => {
    const stateWithoutQuery = state.apply(state.tr.delete(query.from, query.to));
    return matchingQuickActions(stateWithoutQuery, query.query);
};

/** the selected index is not clamped when the list gets shorter while typing */
export const selectedQuickActionIndex = (selectedIndex: number, actionCount: number) => {
    return Math.min(selectedIndex, actionCount - 1);
};

/**
 * Removes the `/query` and applies the action in a single transaction,
 * so that undo restores the `/query` in one step.
 */
export const applyQuickAction = (query: SlashQuery, action: QuickAction): Command => {
    return (state, dispatch) => {
        const tr = state.tr.delete(query.from, query.to);
        let actionTr: Transaction | undefined;
        const isApplied = action.command(state.apply(tr), (applied) => (actionTr = applied));
        if (!isApplied || !actionTr || !dispatch) {
            return isApplied;
        }

        // the action ran on the state without the query, which is `tr.doc`
        actionTr.steps.forEach((step) => tr.step(step));
        tr.setSelection(actionTr.selection.map(tr.doc, new Mapping()));
        dispatch(tr.scrollIntoView());
        return true;
    };
};

const handleMenuKey = (view: EditorView, event: KeyboardEvent): boolean => {
    const menu = slashMenuKey.getState(view.state);
    if (!menu?.query) {
        return false;
    }
    const actions = availableQuickActions(view.state, menu.query);
    if (actions.length === 0) {
        return false;
    }
    const selectedIndex = selectedQuickActionIndex(menu.selectedIndex, actions.length);
    const select = (index: number) => {
        const meta: SlashMenuMeta = { type: 'select', index: (index + actions.length) % actions.length };
        view.dispatch(view.state.tr.setMeta(slashMenuKey, meta));
    };
    switch (event.key) {
        case 'Escape':
            view.dispatch(view.state.tr.setMeta(slashMenuKey, { type: 'dismiss' } satisfies SlashMenuMeta));
            return true;
        case 'ArrowDown':
            select(selectedIndex + 1);
            return true;
        case 'ArrowUp':
            select(selectedIndex - 1);
            return true;
        case 'Enter':
        case 'Tab':
            applyQuickAction(menu.query, actions[selectedIndex])(view.state, view.dispatch, view);
            return true;
        default:
            return false;
    }
};

const findSlashQuery = (state: EditorState): SlashQuery | null => {
    const $cursor = state.selection instanceof TextSelection ? state.selection.$cursor : null;
    if (!$cursor || $cursor.parent.type.spec.code || $cursor.marks().some((mark) => mark.type.spec.code)) {
        return null;
    }
    const textBefore = $cursor.parent.textBetween(0, $cursor.parentOffset, undefined, '￼');
    const match = SLASH_QUERY.exec(textBefore);
    if (!match) {
        return null;
    }
    const query = match[1];
    return { from: $cursor.pos - query.length - 1, to: $cursor.pos, query };
};
