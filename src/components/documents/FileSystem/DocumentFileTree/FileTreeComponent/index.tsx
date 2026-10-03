import { FileTree } from '@pierre/trees/react';
import { default as FileModel } from '@tdev-models/documents/FileSystem/File';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import ContextMenu from './ContextMenu';
import Header from './Header';
import styles from './styles.module.scss';
import { useFileTreeModel } from './WithFileTreeModel';

interface Props {
    onSelected: (document: FileModel | null) => void;
    className?: string;
    height?: string;
}
const FileTreeComponent = observer((props: Props) => {
    const model = useFileTreeModel();

    return (
        <div className={clsx(props.className)}>
            {props.height}
            <FileTree
                model={model}
                className={clsx(styles.tree, 'rounded-lg border')}
                style={{ height: props.height ?? '320px' }}
                renderContextMenu={(item, context) => {
                    return <ContextMenu item={item} context={context} />;
                }}
                header={<Header />}
            />
        </div>
    );
});
export default FileTreeComponent;
