import _ from 'es-toolkit/compat';
import { Options, transformAttributes } from '../helpers';
import type { ContainerDirectiveName } from './plugin';

/**
 * The layout of `:::cards` and `:::flex`, shared by the remark plugin and the editor of the cms.
 * It must not depend on mdast or unified, it is bundled for the browser.
 */

const MIN_WIDTH = '50px';

/** the css classes of the container, the items and the content of the items */
export const FLEX_CLASSES: {
    [key in ContainerDirectiveName]: { container: string; item: string; content: string };
} = {
    cards: {
        container: 'flex-cards flex',
        item: 'item card',
        content: 'card__body'
    },
    flex: {
        container: 'flex',
        item: 'item',
        content: 'content'
    }
};

type Attributes = { [key: string]: string | undefined | null } | undefined | null;

const configureFlexOptions = (options: Options, mergeWith?: Partial<Options>) => {
    const opts = _.merge({}, options, mergeWith) as Options;
    if (!('flexBasis' in opts.style)) {
        const { columns, minWidth, gap } = opts.style;
        const cols = columns ? Number.parseInt(columns as string, 10) : undefined;
        if (cols && minWidth) {
            opts.style.flexBasis = `max(${minWidth}, ${100 / cols}% - calc(${cols - 1} * ${gap || '0.4em'}))`;
            delete opts.style.columns;
            delete opts.style.minWidth;
        } else if (cols) {
            opts.style.flexBasis = `max(${MIN_WIDTH}, ${100 / cols}% - calc(${cols - 1} * ${gap || '0.4em'}))`;
            delete opts.style.columns;
        } else if (minWidth) {
            opts.style.flexBasis = minWidth;
            delete opts.style.minWidth;
        }
    }
    return opts;
};

/**
 * The options of `:::cards{attributes}` or `:::flex{attributes}`.
 * The flex-basis (e.g. from `columns`) applies to the items, it is returned as `itemStyle`.
 */
export const flexContainerOptions = (attributes: Attributes) => {
    const options = configureFlexOptions(transformAttributes(attributes));
    const itemStyle: { [key: string]: string | boolean } = {};
    if ('flexBasis' in options.style) {
        itemStyle.flexBasis = options.style.flexBasis;
        delete options.style.flexBasis;
    }
    return { options, itemStyle };
};

/** the options of an item, from the attributes of its `::br`. The `itemStyle` of the container wins */
export const flexItemOptions = (
    attributes: Attributes,
    itemStyle: { [key: string]: string | boolean } = {}
) => {
    return configureFlexOptions(transformAttributes(attributes), { style: itemStyle });
};
