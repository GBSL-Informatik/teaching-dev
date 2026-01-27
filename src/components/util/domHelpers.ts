import React from "react";

export const extractListItems = (children: React.ReactElement): React.ReactNode[] | null => {
    const liContent = React.useMemo(() => {
        if (!children) {
            return null;
        }
        /**
         * Extracts the children of the first <ol> element.
         * <ol>
         *   <li>Item 1</li>
         *   <li>Item 2</li>
         * </ol>
         * Is represented as:
         * ```js
         * {
         *  type: 'ol',
         *  props: {
         *   children: [
         *    {
         *      type: 'li',
         *      props: { children: 'Item 1' },
         *    },
         *    {
         *      type: 'li',
         *      props: { children: 'Item 2' },
         *    },
         *   ]
         *  }
         * }
         * ```
         * Use the `children.props.children` to access the nested `<li>` elements, but don't enforce
         * that the root element is an `<ol>`, as it might be a custom component that renders an `<ol>`
         * internally. Like that, e.g. `<ul>` is supported as well (where Docusaurus uses an `MDXUl` Component...).
         */
        const nestedChildren = (children.props as any)?.children;
        if (Array.isArray(nestedChildren)) {
            return nestedChildren
                .filter((c: any) => typeof c === 'object' && c !== null && c.props?.children)
                .map((c: any) => {
                    return c.props.children as React.ReactNode;
                });
        }
        throw new Error(
            `ProgressState must have an <ol> as a child, found ${typeof children.type === 'function' ? children.type.name : children.type}`
        );
    }, [children]);
    return liContent;
};