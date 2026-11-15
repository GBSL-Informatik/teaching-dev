import type { DirType } from '@tdev-components/FileSystem/Dir';
import type { Node } from 'prosemirror-model';
import { schema } from '../../schema';

type TreeItem = DirType['children'][number];

/**
 * The items of the list of `:::tree`, like `remark-file-trees` reads them from the markdown list.
 * `null` when the content is no valid tree, the page would fail to build.
 */
export const fileTreeItems = (directive: Node): TreeItem[] | null => {
    const list = directive.firstChild;
    if (directive.childCount !== 1 || !list || !isList(list)) {
        return null;
    }
    return treeItems(list);
};

const isList = (node: Node) =>
    node.type === schema.nodes.bullet_list || node.type === schema.nodes.ordered_list;

const treeItems = (list: Node): TreeItem[] | null => {
    const items: TreeItem[] = [];
    for (let i = 0; i < list.childCount; i++) {
        const item = treeItem(list.child(i));
        if (item === null) {
            return null;
        }
        items.push(item);
    }
    return items;
};

/** a name and at most one nested list */
const treeItem = (item: Node): TreeItem | null => {
    const [label, nested, ...extra] = item.children;
    if (item.attrs.checked !== null || label.type !== schema.nodes.paragraph || extra.length > 0) {
        return null;
    }
    const name = itemName(label);
    if (name === null) {
        return null;
    }
    if (!nested) {
        return name;
    }
    const children = isList(nested) ? treeItems(nested) : null;
    return children && { name, children };
};

/** names are plain text or inline code */
const itemName = (paragraph: Node) => {
    const isPlain = paragraph.children.every(
        (child) => child.isText && child.marks.every((mark) => mark.type === schema.marks.code)
    );
    const name = paragraph.textContent;
    return isPlain && name.trim() ? name : null;
};
