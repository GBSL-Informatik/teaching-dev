import { baseKeymap, chainCommands, exitCode, setBlockType } from 'prosemirror-commands';
import { dropCursor } from 'prosemirror-dropcursor';
import { gapCursor } from 'prosemirror-gapcursor';
import { history, redo, undo } from 'prosemirror-history';
import {
    InputRule,
    inputRules,
    textblockTypeInputRule,
    undoInputRule,
    wrappingInputRule
} from 'prosemirror-inputrules';
import { keymap } from 'prosemirror-keymap';
import { liftListItem, sinkListItem, splitListItem } from 'prosemirror-schema-list';
import type { Command, Plugin } from 'prosemirror-state';
import { goToNextCell, tableEditing } from 'prosemirror-tables';
import { toggleMarkOnWord, withoutSpacesAtCursor } from '../commands';
import type MdxDocument from '../models/MdxDocument';
import { arrowIntoCode } from '../nodeViews/CodeMirrorNodeView';
import { schema } from '../schema';
import { suggestionSources } from '../suggestions';
import { deflist, enterInDeflist, startDefinitionRule } from './deflist';
import { deleteEmptyDirectiveItem, enterInDirectiveItem, splitDirectiveItem } from './directiveItems';
import { dragHandle } from './dragHandle';
import { imageFiles } from './imageFiles';
import { enterAtEndOfIsolatingNode, leaveIsolatingNode } from './isolatingNodes';
import { markInputRules } from './markInputRules';
import { suggestionMenu } from './suggestionMenu';
import { uuidMarker } from './uuidMarker';

const { nodes, marks } = schema;

const insertHardBreak: Command = chainCommands(exitCode, (state, dispatch) => {
    dispatch?.(state.tr.replaceSelectionWith(nodes.hard_break.create()).scrollIntoView());
    return true;
});

const editorKeymap = keymap({
    'Mod-z': undo,
    'Shift-Mod-z': redo,
    'Mod-y': redo,
    Backspace: chainCommands(undoInputRule, deleteEmptyDirectiveItem),
    'Mod-b': toggleMarkOnWord(marks.strong),
    'Mod-i': toggleMarkOnWord(marks.emphasis),
    'Mod-e': toggleMarkOnWord(marks.code),
    'Mod-u': toggleMarkOnWord(marks.box),
    'Mod-k': toggleMarkOnWord(marks.kbd),
    'Shift-Enter': insertHardBreak,
    // like a page break in word processors: after the directive or component ending at the cursor,
    // the next card or column, a line break elsewhere
    'Mod-Enter': chainCommands(
        leaveIsolatingNode,
        withoutSpacesAtCursor(splitDirectiveItem),
        insertHardBreak
    ),
    Enter: chainCommands(
        enterInDeflist,
        withoutSpacesAtCursor(splitListItem(nodes.list_item)),
        enterInDirectiveItem,
        enterAtEndOfIsolatingNode,
        withoutSpacesAtCursor(baseKeymap.Enter)
    ),
    Tab: chainCommands(goToNextCell(1), sinkListItem(nodes.list_item)),
    'Shift-Tab': chainCommands(goToNextCell(-1), liftListItem(nodes.list_item)),
    ArrowLeft: arrowIntoCode('left'),
    ArrowRight: arrowIntoCode('right'),
    ArrowUp: arrowIntoCode('up'),
    ArrowDown: arrowIntoCode('down'),
    'Shift-Ctrl-0': setBlockType(nodes.paragraph),
    ...Object.fromEntries(
        [1, 2, 3, 4, 5, 6].map((level) => [`Shift-Ctrl-${level}`, setBlockType(nodes.heading, { level })])
    )
});

/**
 * Markdown shortcuts: typing markdown syntax at the start of a line creates the corresponding node,
 * typing inline syntax such as `**bold**` applies the corresponding mark.
 * Backspace right after a shortcut restores the typed text.
 */
const markdownInputRules = inputRules({
    rules: [
        textblockTypeInputRule(/^(#{1,6})\s$/, nodes.heading, (match) => ({ level: match[1].length })),
        textblockTypeInputRule(/^```([\w-]*)\s$/, nodes.code_block, (match) => ({ lang: match[1] })),
        textblockTypeInputRule(/^\$\$\s$/, nodes.math_block),
        wrappingInputRule(/^\s*>\s$/, nodes.blockquote),
        wrappingInputRule(/^\s*([-+*])\s$/, nodes.bullet_list),
        wrappingInputRule(
            /^(\d+)\.\s$/,
            nodes.ordered_list,
            (match) => ({ start: Number(match[1]) }),
            (match, node) => node.childCount + node.attrs.start === Number(match[1])
        ),
        new InputRule(/^---$/, (state, _match, start, end) => {
            const $start = state.doc.resolve(start);
            if ($start.parent.type !== nodes.paragraph || $start.parent.content.size !== end - start) {
                return null;
            }
            return state.tr.replaceRangeWith($start.before(), $start.after(), nodes.thematic_break.create());
        }),
        startDefinitionRule,
        ...markInputRules
    ]
});

/** the document provides what plugins need beyond the state, e.g. the images next to the file */
export const createPlugins = (document: MdxDocument): Plugin[] => [
    // before the keymaps, it handles enter and the arrow keys while the menu is open
    suggestionMenu(suggestionSources(document)),
    imageFiles(document),
    markdownInputRules,
    editorKeymap,
    keymap(baseKeymap),
    history(),
    dropCursor({ color: 'var(--ifm-color-primary)', width: 2 }),
    gapCursor(),
    dragHandle(),
    uuidMarker(),
    deflist(),
    tableEditing()
];
