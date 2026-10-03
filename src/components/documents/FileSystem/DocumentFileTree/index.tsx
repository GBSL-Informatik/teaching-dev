import DocumentContext from '@tdev-components/documents/DocumentContext';
import Directory from '@tdev-models/documents/FileSystem/Directory';
import { default as FileModel } from '@tdev-models/documents/FileSystem/File';
import clsx from 'clsx';
import { Hashery } from 'hashery';
import { observer } from 'mobx-react-lite';
import React from 'react';
import DocumentView from '../DocumentView';
import FileTreeComponent from './FileTreeComponent';
import WithFileTreeModel from './FileTreeComponent/WithFileTreeModel';
import styles from './styles.module.scss';

const hashery = new Hashery({ cache: { enabled: false, maxSize: 20 } });

interface Props {
    dir: Directory;
}

const DocumentFileTree = observer((props: Props) => {
    const { dir } = props;
    const [selected, setSelected] = React.useState<FileModel | null>(null);

    return (
        <div className={clsx(styles.container)}>
            <DocumentContext document={dir}>
                <WithFileTreeModel onSelected={setSelected} key={dir.localObjectId}>
                    <FileTreeComponent onSelected={setSelected} height={'450px'} />
                </WithFileTreeModel>
            </DocumentContext>
            <div className={clsx(styles.selectedFile)}>{<DocumentView document={selected?.document} />}</div>
        </div>
    );
});

export default DocumentFileTree;
