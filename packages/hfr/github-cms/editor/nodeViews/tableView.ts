import type { NodeViewConstructor } from 'prosemirror-view';

/**
 * A table in a box, which scrolls horizontally instead of overflowing the page,
 * see `.cms-table-scroll` in `Editor/styles.module.scss`.
 */
export const tableView: NodeViewConstructor = () => {
    const dom = window.document.createElement('div');
    dom.className = 'cms-table-scroll';
    const table = dom.appendChild(window.document.createElement('table'));
    const contentDOM = table.appendChild(window.document.createElement('tbody'));
    return { dom, contentDOM };
};
