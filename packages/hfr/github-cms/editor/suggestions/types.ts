import type { Command, EditorState } from 'prosemirror-state';

export interface Suggestion {
    /** unique within the suggestions of a source */
    label: string;
    icon: string;
    /** applied to the state without the typed text */
    command: Command;
}

/**
 * Offers suggestions for text typed in a textblock, e.g. the quick actions for `/tip`.
 */
export interface SuggestionSource {
    /** matches the typed text, ending at the cursor. The first group is the query, e.g. `tip` of `/tip` */
    pattern: RegExp;
    /** the suggestions for the query, the best match first */
    suggestions: (state: EditorState, query: string) => Suggestion[];
}
