import { useStore } from '@tdev-hooks/useStore';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import 'prosemirror-gapcursor/style/gapcursor.css';
import 'prosemirror-tables/style/tables.css';
import { EditorView } from 'prosemirror-view';
import 'prosemirror-view/style/prosemirror.css';
import React from 'react';
import ImageUploadDialog from '../components/ImageUploadDialog';
import InsertImageDialog from '../components/InsertImageDialog';
import MdxDiff from '../components/MdxDiff';
import NewDrawingEditor from '../components/NewDrawingEditor';
import SuggestionMenu from '../components/SuggestionMenu';
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
    const userStore = useStore('userStore');
    // not a protection: students still see the solutions in the markdown source
    const hideSolutions = !userStore.current?.hasElevatedAccess;

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

    React.useEffect(() => {
        // suggested when typing `![`, see `suggestions/images.tsx`
        document.file.loadImages();
    }, [document]);

    React.useEffect(() => {
        if (!document.showDiff) {
            document.view?.focus();
        }
    }, [document.showDiff]);

    return (
        <div className={clsx(styles.editor)}>
            <Toolbar document={document} />
            {/* the editor stays mounted while the diff is shown to keep its state (e.g. the selection) */}
            <div className={clsx(styles.contentArea)}>
                <div
                    ref={setMount}
                    className={clsx(
                        styles.content,
                        document.showDiff && styles.hidden,
                        hideSolutions && styles.hideSolutions
                    )}
                />
                <SuggestionMenu document={document} container={mount} />
            </div>
            {document.showDiff && <MdxDiff file={document.file} />}
            <NodeViewPortals document={document} />
            <InsertImageDialog document={document} />
            <ImageUploadDialog document={document} />
            <NewDrawingEditor document={document} />
        </div>
    );
});

export default Editor;
