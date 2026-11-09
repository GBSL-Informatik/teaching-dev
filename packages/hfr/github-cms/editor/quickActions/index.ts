import {
    mdiFormatHeader1,
    mdiFormatHeader2,
    mdiFormatHeader3,
    mdiFormatListBulleted,
    mdiFormatListNumbered,
    mdiFormatQuoteClose
} from '@mdi/js';
import type { Command, EditorState } from 'prosemirror-state';
import { setCurrentBlockType, toggleBlockquote, toggleList } from '../commands';
import { schema } from '../schema';
import { ADMONITION_ITEMS, INSERT_ITEMS, insertCommand, type MenuItem } from '../Toolbar/insertItems';
import { fuzzyScore } from './fuzzyScore';

const { nodes } = schema;

export interface QuickAction {
    label: string;
    icon: string;
    /** additional search terms, e.g. the markdown syntax */
    keywords: string[];
    command: Command;
}

const FORMATS: QuickAction[] = [
    {
        label: 'Titel 1',
        icon: mdiFormatHeader1,
        keywords: ['#', 'h1', 'heading'],
        command: setCurrentBlockType('heading1')
    },
    {
        label: 'Titel 2',
        icon: mdiFormatHeader2,
        keywords: ['##', 'h2', 'heading'],
        command: setCurrentBlockType('heading2')
    },
    {
        label: 'Titel 3',
        icon: mdiFormatHeader3,
        keywords: ['###', 'h3', 'heading'],
        command: setCurrentBlockType('heading3')
    },
    {
        label: 'Aufzählung',
        icon: mdiFormatListBulleted,
        keywords: ['-', 'liste', 'list'],
        command: toggleList(nodes.bullet_list)
    },
    {
        label: 'Nummerierte Liste',
        icon: mdiFormatListNumbered,
        keywords: ['1.', 'list'],
        command: toggleList(nodes.ordered_list)
    },
    {
        label: 'Zitat',
        icon: mdiFormatQuoteClose,
        keywords: ['>', 'quote', 'blockquote'],
        command: toggleBlockquote
    }
];

const fromMenuItem = (item: MenuItem): QuickAction => ({
    label: item.label,
    icon: item.icon,
    keywords: item.keywords ?? [],
    command: insertCommand(item)
});

/** without a query, the actions are offered in this order */
const QUICK_ACTIONS: QuickAction[] = [
    ...FORMATS,
    ...INSERT_ITEMS.map(fromMenuItem),
    ...ADMONITION_ITEMS.map(fromMenuItem)
];

/**
 * The actions matching the query that can be applied to the state, the best match first.
 */
export const matchingQuickActions = (state: EditorState, query: string): QuickAction[] => {
    return QUICK_ACTIONS.map((action) => ({
        action,
        score: fuzzyScore(query, [action.label, ...action.keywords])
    }))
        .filter(({ action, score }) => score > 0 && action.command(state))
        .sort((a, b) => b.score - a.score)
        .map(({ action }) => action);
};
