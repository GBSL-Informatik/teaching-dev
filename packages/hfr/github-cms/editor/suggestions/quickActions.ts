import {
    mdiFormatHeader1,
    mdiFormatHeader2,
    mdiFormatHeader3,
    mdiFormatListBulleted,
    mdiFormatListNumbered,
    mdiFormatQuoteClose,
    mdiImageOutline
} from '@mdi/js';
import type { EditorState } from 'prosemirror-state';
import { insertText, setCurrentBlockType, toggleBlockquote, toggleList } from '../commands';
import { schema } from '../schema';
import { ADMONITION_ITEMS, INSERT_ITEMS, insertCommand, type MenuItem } from '../Toolbar/insertItems';
import { fuzzyFilter } from './fuzzyScore';
import type { Suggestion, SuggestionSource } from './types';

const { nodes } = schema;

interface QuickAction extends Suggestion {
    /** additional search terms, e.g. the markdown syntax */
    keywords: string[];
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
    },
    {
        label: 'Bild',
        icon: mdiImageOutline,
        keywords: ['![', 'image', 'img'],
        // continues with the images to choose from, see `imageSource`
        command: insertText('![')
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
 * `/tip`: the actions matching the query that can be applied, the best match first.
 */
export const quickActionSource: SuggestionSource = {
    pattern: /(?<=^|\s)\/([^\s/]{0,30})$/,
    suggestions: (state: EditorState, query: string) => {
        const matching = fuzzyFilter(QUICK_ACTIONS, query, (action) => [action.label, ...action.keywords]);
        return matching.filter((action) => action.command(state));
    }
};
