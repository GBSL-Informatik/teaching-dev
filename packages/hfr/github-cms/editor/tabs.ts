import type { Node, ResolvedPos } from 'prosemirror-model';
import { type Command, TextSelection } from 'prosemirror-state';
import { stringAttribute } from './jsxAttributes';
import { type JsxAttribute, schema } from './schema';

const { nodes } = schema;

/**
 * `<Tabs>` with `<TabItem value="..." label="...">` children, see
 * https://docusaurus.io/docs/markdown-features/tabs
 */
const isJsx = (node: Node, name: string) => node.type === nodes.jsx_flow && node.attrs.name === name;
export const isTabs = (node: Node) => isJsx(node, 'Tabs');
export const isTabItem = (node: Node) => isJsx(node, 'TabItem');

export const tabItems = (tabs: Node) => tabs.children.filter(isTabItem);

export const createTabItem = (value: string, label: string) => {
    const attributes: JsxAttribute[] = [
        { type: 'attribute', name: 'value', value },
        { type: 'attribute', name: 'label', value: label }
    ];
    return nodes.jsx_flow.create(
        { name: 'TabItem', attributes },
        nodes.paragraph.create(null, schema.text('Inhalt'))
    );
};

/** a tab item with a value not used by the other items of the tabs */
const nextTabItem = (tabs: Node) => {
    const values = tabItems(tabs).map((item) => stringAttribute(item.attrs.attributes, 'value'));
    let number = values.length + 1;
    while (values.includes(`tab${number}`)) {
        number++;
    }
    return createTabItem(`tab${number}`, `Tab ${number}`);
};

/** the depth of the innermost `<Tabs>` or `<TabItem>` around the position */
const tabsDepth = ($pos: ResolvedPos) => {
    for (let depth = $pos.depth; depth > 0; depth--) {
        const node = $pos.node(depth);
        if (isTabs(node) || isTabItem(node)) {
            return depth;
        }
    }
    return null;
};

/**
 * Inserts a new tab after the tab item at the cursor. Directly inside `<Tabs>`,
 * the tab follows the selected block or the block at the cursor.
 */
export const insertTabItem: Command = (state, dispatch) => {
    const { $from, to } = state.selection;
    const depth = tabsDepth($from);
    if (depth === null) {
        return false;
    }
    if (dispatch) {
        const isInTabItem = isTabItem($from.node(depth));
        const tabs = isInTabItem ? $from.node(depth - 1) : $from.node(depth);
        const isBlockSelected = depth === $from.depth;
        const pos = isInTabItem ? $from.after(depth) : isBlockSelected ? to : $from.after(depth + 1);
        const tr = state.tr.insert(pos, nextTabItem(tabs));
        dispatch(tr.setSelection(TextSelection.near(tr.doc.resolve(pos + 1))).scrollIntoView());
    }
    return true;
};
