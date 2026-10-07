import DocumentContext from '@tdev-components/documents/DocumentContext';
import { useStore } from '@tdev-hooks/useStore';
import Directory from '@tdev-models/documents/FileSystem/Directory';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import DocumentView from '../DocumentView';
import FileTreeComponent from './FileTreeComponent';
import WithFileTreeModel from './FileTreeComponent/WithFileTreeModel';
import styles from './styles.module.scss';

interface Props {
    dir: Directory;
    height?: string;
}

const DocumentFileTree = observer((props: Props) => {
    const { dir } = props;
    const viewStore = useStore('viewStore');

    return (
        <DocumentContext document={dir}>
            <WithFileTreeModel key={dir.localObjectId}>
                <div className={clsx(styles.container)}>
                    <FileTreeComponent height={props.height || '450px'} />
                    <div className={clsx(styles.selectedFile)}>
                        <DocumentView rootDirId={dir.id} />
                        <small className={clsx(styles.filePath)}>
                            {viewStore.getSelectedFile(dir.id)?.filePath}
                        </small>
                    </div>
                </div>
            </WithFileTreeModel>
        </DocumentContext>
    );
});

export default DocumentFileTree;
