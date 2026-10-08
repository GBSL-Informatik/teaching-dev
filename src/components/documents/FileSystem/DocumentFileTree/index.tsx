import { mdiDragVertical } from '@mdi/js';
import Icon from '@mdi/react';
import DocumentContext from '@tdev-components/documents/DocumentContext';
import Alert from '@tdev-components/shared/Alert';
import { SIZE_S } from '@tdev-components/shared/iconSizes';
import { useStore } from '@tdev-hooks/useStore';
import Directory from '@tdev-models/documents/FileSystem/Directory';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import React from 'react';
import DocumentView from '../DocumentView';
import FileTreeComponent from './FileTreeComponent';
import WithFileTreeModel from './FileTreeComponent/WithFileTreeModel';
import { useFileTreeResize } from './hooks/useFileTreeResize';
import MobileHeader from './MobileHeader';
import styles from './styles.module.scss';

interface Props {
    dir: Directory;
    className?: string;
    name?: string;
    height?: string;
    standalone?: boolean;
}

const DocumentFileTree = observer((props: Props) => {
    const { dir } = props;
    const { fileTreeView } = useStore('viewStore');
    const selectedFile = fileTreeView.getSelectedFile(dir.id);
    const isMobileExpanded = fileTreeView.isMobileFileTreeExpanded(dir.id);
    const treeId = React.useId();
    const { containerRef, width, isCollapsed, isDragging, separatorProps } = useFileTreeResize(dir.id);
    const notifications = fileTreeView.notificationsBy(dir.id);

    return (
        <DocumentContext document={dir}>
            <WithFileTreeModel key={dir.localObjectId}>
                {notifications.length > 0 && (
                    <div className={styles.notifications}>
                        {notifications.map((n) => (
                            <Alert
                                key={n.id}
                                type={n.type}
                                onDiscard={() => fileTreeView.dismissNotification(n.id)}
                            >
                                {n.message}
                            </Alert>
                        ))}
                    </div>
                )}
                <div
                    ref={containerRef}
                    className={clsx(
                        styles.container,
                        isDragging && styles.resizing,
                        props.standalone && styles.standalone,
                        props.className
                    )}
                    style={
                        {
                            '--file-tree-width': `${width}px`,
                            '--desktop-file-tree-height': props.height || '450px'
                        } as React.CSSProperties
                    }
                >
                    <MobileHeader name={props.name} treeId={treeId} />
                    <div
                        id={treeId}
                        className={clsx(styles.sidebar, !isMobileExpanded && styles.mobileCollapsed)}
                    >
                        <FileTreeComponent
                            className={clsx(styles.tree, isCollapsed && styles.desktopCollapsed)}
                            name={props.name}
                            height="var(--file-tree-height)"
                            onFileClick={() => fileTreeView.setMobileFileTreeExpanded(dir.id, false)}
                        />
                    </div>
                    <div {...separatorProps} className={clsx(styles.divider, isDragging && styles.dragging)}>
                        <Icon
                            path={mdiDragVertical}
                            size={SIZE_S}
                            className={styles.grip}
                            aria-hidden="true"
                        />
                    </div>
                    <div className={styles.selectedFile}>
                        <DocumentView rootDirId={dir.id} />
                        <small className={clsx(styles.filePath, isCollapsed && styles.collapsed)}>
                            {selectedFile?.filePath}
                        </small>
                    </div>
                </div>
            </WithFileTreeModel>
        </DocumentContext>
    );
});

export default DocumentFileTree;
