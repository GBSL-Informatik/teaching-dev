import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import { useFirstMainDocument } from '@tdev-hooks/useFirstMainDocument';
import { MetaInit, ModelMeta } from '@tdev-models/documents/ProgressState';
import Item from './Item';
import { useStore } from '@tdev-hooks/useStore';

interface Props extends MetaInit {
    id: string;
    children?: React.ReactNode;
    labels?: React.ReactNode[];
}

const useExtractedChildren = (children: React.ReactElement): React.ReactNode[] | null => {
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

const ProgressState = observer((props: Props) => {
    const [meta] = React.useState(new ModelMeta(props));
    const pageStore = useStore('pageStore');
    const doc = useFirstMainDocument(props.id, meta);
    const children = useExtractedChildren(props.children as React.ReactElement);
    React.useEffect(() => {
        doc?.setTotalSteps(children?.length || 0);
    }, [doc, children?.length]);

    React.useEffect(() => {
        if (doc.root && pageStore.current && !doc.root.isDummy) {
            pageStore.current.addDocumentRoot(doc);
        }
    }, [doc, pageStore.current]);

    if (!children) {
        return null;
    }
    return (
        <>
            <ol className={clsx(styles.progress)}>
                {doc.steps.map((c, idx) => (
                    <Item
                        key={idx}
                        item={children[idx] || null}
                        step={c}
                        label={props.labels?.[idx] || `Schritt ${idx + 1}`}
                    />
                ))}
            </ol>
        </>
    );
});

export default ProgressState;
