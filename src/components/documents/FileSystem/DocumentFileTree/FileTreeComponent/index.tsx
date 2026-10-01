import { FileTree } from '@pierre/trees/react';
import { useStore } from '@tdev-hooks/useStore';
import Directory from '@tdev-models/documents/FileSystem/Directory';
import { default as FileModel } from '@tdev-models/documents/FileSystem/File';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import ContextMenu from './ContextMenu';
import Header from './Header';
import styles from './styles.module.scss';
import { useFileTreeModel } from './WithFileTreeModel';

interface Props {
    dir: Directory;
    onSelected: (document: FileModel | null) => void;
    className?: string;
}
const FileTreeComponent = observer((props: Props) => {
    const { dir } = props;
    const documentStore = useStore('documentStore');
    const docRootStore = useStore('documentRootStore');
    const model = useFileTreeModel();

    if (!dir || !model) {
        return null;
    }

    return (
        <div className={clsx(props.className)}>
            <FileTree
                model={model}
                className={clsx(styles.tree, 'rounded-lg border')}
                style={{ height: '320px' }}
                renderContextMenu={(item, context) => {
                    return <ContextMenu dir={dir} item={item} context={context} />;
                }}
                header={<Header />}
            />
        </div>
    );
});
export default FileTreeComponent;
