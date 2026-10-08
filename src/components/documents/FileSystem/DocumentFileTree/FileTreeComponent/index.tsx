import { FileTree } from '@pierre/trees/react';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import { useFileTreeModel } from '../hooks/useFileTreeModel';
import ContextMenu from './ContextMenu';
import Header from './Header';
import styles from './styles.module.scss';

interface Props {
    className?: string;
    height?: string;
    name?: string;
    onFileClick?: () => void;
}
const FileTreeComponent = observer((props: Props) => {
    const model = useFileTreeModel();

    return (
        <div className={clsx(props.className, styles.fileTreeComponent)}>
            <FileTree
                model={model}
                className={styles.tree}
                style={{ height: props.height ?? '320px' }}
                onClick={(event) => {
                    if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.shiftKey) {
                        return;
                    }
                    const selected = model.getSelectedPaths();
                    // The tree renders rows in a shadow root. Also handle tapping
                    // the already selected file, which does not change selection.
                    const fileRow = event.nativeEvent
                        .composedPath()
                        .find(
                            (target) =>
                                target instanceof HTMLElement &&
                                target.dataset.itemType === 'file' &&
                                target.dataset.itemPath === selected[0]
                        );
                    if (fileRow && selected.length === 1) {
                        props.onFileClick?.();
                    }
                }}
                renderContextMenu={(item, context) => {
                    return <ContextMenu item={item} context={context} />;
                }}
                header={<Header name={props.name} />}
            />
        </div>
    );
});

export default FileTreeComponent;
