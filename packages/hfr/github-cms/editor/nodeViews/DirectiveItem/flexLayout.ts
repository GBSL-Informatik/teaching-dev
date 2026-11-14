import {
    FLEX_CLASSES,
    flexContainerOptions,
    flexItemOptions
} from '@tdev-plugins/remark-flex-cards/flexOptions';
import type { Node } from 'prosemirror-model';
import type { NodeStyle } from '../ReactNodeView';

/**
 * `:::cards` and `:::flex` are laid out like on the page, with the classes and styles of
 * `remark-flex-cards`. The site css styles `div.flex > div.item`.
 */

/**
 * The flex-basis the container sets for its items (e.g. from `columns`). Items read it as css
 * variable, since an item is not redrawn when only the attributes of its container change.
 */
const ITEM_FLEX_BASIS = '--cms-item-flex-basis';
/** the flex-basis of `div.flex > div.item` in the site css */
const DEFAULT_FLEX_BASIS = '10px';

/** boolean options (e.g. `{noFlex}`) are no css values */
const cssStyle = (style: { [key: string]: string | boolean }): NodeStyle => {
    const entries = Object.entries(style).filter((entry): entry is [string, string] => {
        return typeof entry[1] === 'string';
    });
    return Object.fromEntries(entries);
};

export const itemsDirectiveContent = (node: Node) => {
    const { options, itemStyle } = flexContainerOptions(node.attrs.attributes);
    const classes = FLEX_CLASSES[node.attrs.name as keyof typeof FLEX_CLASSES];
    const style = cssStyle(options.style);
    if (typeof itemStyle.flexBasis === 'string') {
        style[ITEM_FLEX_BASIS] = itemStyle.flexBasis;
    }
    return { className: `${classes.container} ${options.className}`, style };
};

export const directiveItemClassName = (node: Node) => {
    return `item ${flexItemOptions(node.attrs.attributes).className}`;
};

export const directiveItemStyle = (node: Node): NodeStyle => {
    const { flexBasis, ...style } = cssStyle(flexItemOptions(node.attrs.attributes).style);
    // the flex-basis of the container wins, as in `flexItemOptions`
    return { ...style, flexBasis: `var(${ITEM_FLEX_BASIS}, ${flexBasis ?? DEFAULT_FLEX_BASIS})` };
};
