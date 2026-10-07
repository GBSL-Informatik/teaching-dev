import DocumentContext from '@tdev-components/documents/DocumentContext';
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

    return (
        <div className={clsx(styles.container)}>
            <DocumentContext document={dir}>
                <WithFileTreeModel key={dir.localObjectId}>
                    <FileTreeComponent height={props.height || '450px'} />
                </WithFileTreeModel>
            </DocumentContext>
            <div className={clsx(styles.selectedFile)}>
                <DocumentView dir={dir} />
                <small className={clsx(styles.filePath)}>{dir.selectedFiles[0]?.filePath}</small>
            </div>
        </div>
    );
});

export default DocumentFileTree;
