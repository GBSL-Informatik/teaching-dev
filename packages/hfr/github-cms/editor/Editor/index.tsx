import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import 'prosemirror-gapcursor/style/gapcursor.css';
import 'prosemirror-tables/style/tables.css';
import 'prosemirror-view/style/prosemirror.css';
import { EditorView } from 'prosemirror-view';
import React from 'react';
import type MdxDocument from '../models/MdxDocument';
import { createNodeViews } from '../nodeViews';
import Toolbar from '../Toolbar';
import styles from './styles.module.scss';

interface Props {
    document: MdxDocument;
}

/**
 * Renders the React content of all node views. Portals keep the React context
 * (stores, docusaurus) available inside the node views.
 */
const NodeViewPortals = observer(({ document }: Props) => {
    return <>{[...document.portals.values()]}</>;
});

const Editor = observer(({ document }: Props) => {
    const [mount, setMount] = React.useState<HTMLDivElement | null>(null);

    React.useEffect(() => {
        if (!mount) {
            return;
        }
        const view = new EditorView(mount, {
            state: document.state,
            nodeViews: createNodeViews(document),
            dispatchTransaction: document.dispatch,
            attributes: { class: clsx('markdown', styles.prosemirror) }
        });
        document.setView(view);
        return () => {
            document.setView(null);
            view.destroy();
            document.flush();
        };
    }, [mount, document]);

    return (
        <div className={clsx(styles.editor)}>
            <Toolbar document={document} />
            <div ref={setMount} className={clsx(styles.content)} />
            <NodeViewPortals document={document} />
        </div>
    );
});

export default Editor;
