import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import { useFirstMainDocument } from '@tdev-hooks/useFirstMainDocument';
import { MetaInit, ModelMeta } from '@tdev-models/documents/ProgressState';
import Item from './Item';
import { useStore } from '@tdev-hooks/useStore';

import UnknownDocumentType from '@tdev-components/shared/Alert/UnknownDocumentType';
import { extractListItems } from '@tdev-components/util/domHelpers';
interface Props extends MetaInit {
    id: string;
    float?: 'left' | 'right';
    children?: React.ReactNode;
    labels?: React.ReactNode[];
}

const ProgressState = observer((props: Props) => {
    const [meta] = React.useState(new ModelMeta(props));
    const pageStore = useStore('pageStore');
    const doc = useFirstMainDocument(props.id, meta);
    const children = extractListItems(props.children as React.ReactElement);
    React.useEffect(() => {
        doc?.setTotalSteps(children?.length || 0);
    }, [doc, children?.length]);

    React.useEffect(() => {
        if (doc?.root && pageStore.current && !doc.root.isDummy) {
            pageStore.current.addDocumentRoot(doc);
        }
    }, [doc, pageStore.current]);

    if (!doc) {
        return <UnknownDocumentType type={meta.type} />;
    }

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
                        float={props.float}
                        label={props.labels?.[idx] || `Schritt ${idx + 1}`}
                    />
                ))}
            </ol>
        </>
    );
});

export default ProgressState;
