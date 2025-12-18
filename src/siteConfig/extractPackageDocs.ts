import type {
    NormalizedSidebar,
    NormalizedSidebarItem
} from '@docusaurus/plugin-content-docs/src/sidebars/types.js';

const extractPackageDocs = (items: NormalizedSidebar): NormalizedSidebar => {
    // Reverse items in categories
    const result = items.map((item) => {
        if (item.type !== 'category' || item.key !== 'packages-docs') {
            return item;
        }
        const itemCategory = {
            ...item,
            items: item.items.slice().flatMap((subItem) => {
                if (subItem.type !== 'category') {
                    return [subItem];
                }
                const newItems = subItem.items.reduce((acc, subSubItem) => {
                    // if a doc is found as a direct child of the category, keep it
                    if (subSubItem.type !== 'category') {
                        return [...acc, subSubItem];
                    }
                    // if the sub-sub-category is empty and has a link to a doc, keep the link
                    if (subSubItem.items.length === 0 && subSubItem.link?.type === 'doc') {
                        return [...acc, subSubItem];
                    }
                    // otherwise, inline the items of the sub-sub-category
                    if (subSubItem.items.length === 1 && !subSubItem.link) {
                        return [...acc, ...subSubItem.items];
                    }
                    return [...acc, subSubItem];
                }, [] as NormalizedSidebarItem[]);
                return {
                    ...subItem,
                    items: newItems
                } as NormalizedSidebarItem;
            })
        };
        return itemCategory;
    });
    return result;
};

export default extractPackageDocs;
