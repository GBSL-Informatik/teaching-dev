import DocumentContext from '@tdev-components/documents/DocumentContext';
import Alert from '@tdev-components/shared/Alert';
import PanHorizontally from '@tdev-components/shared/PanHorizontally';
import { useStore } from '@tdev-hooks/useStore';
import Directory from '@tdev-models/documents/FileSystem/Directory';
import { FILE_TREE_DEFAULT_WIDTH } from '@tdev-stores/ViewStores/FileTreeView';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import React from 'react';
import DocumentView from '../DocumentView';
import FileTreeComponent from './FileTreeComponent';
import WithFileTreeModel from './FileTreeComponent/WithFileTreeModel';
import MobileHeader from './MobileHeader';
import styles from './styles.module.scss';

const DIVIDER_WIDTH = 12;
const MIN_DOCUMENT_WIDTH = 200;
const MOBILE_MEDIA_QUERY = '(max-width: 768px)';

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
    const containerRef = React.useRef<HTMLDivElement>(null);
    const startWidthRef = React.useRef<number | null>(null);
    const [isDragging, setIsDragging] = React.useState(false);
    const width = fileTreeView.getFileTreeWidth(dir.id);
    const isCollapsed = width === 0;
    const notifications = fileTreeView.notificationsBy(dir.id);

    const maxWidth = () =>
        Math.max(0, (containerRef.current?.clientWidth ?? 0) - DIVIDER_WIDTH - MIN_DOCUMENT_WIDTH);
    const resize = (nextWidth: number) => fileTreeView.setFileTreeWidth(dir.id, nextWidth, maxWidth());
    const toggle = () => resize(isCollapsed ? FILE_TREE_DEFAULT_WIDTH : 0);
    const endResize = () => {
        startWidthRef.current = null;
        setIsDragging(false);
    };

    React.useEffect(() => {
        endResize();
        const container = containerRef.current;
        if (!container) {
            return;
        }
        const mobileQuery = window.matchMedia(MOBILE_MEDIA_QUERY);
        const clampDesktopWidth = () => {
            // Hidden containers have no usable width yet.
            if (!mobileQuery.matches && container.clientWidth > 0) {
                fileTreeView.setFileTreeWidth(dir.id, fileTreeView.getFileTreeWidth(dir.id), maxWidth());
            }
        };
        const handleLayoutChange = () => {
            endResize();
            clampDesktopWidth();
        };
        const resizeObserver = new ResizeObserver(clampDesktopWidth);
        resizeObserver.observe(container);
        mobileQuery.addEventListener('change', handleLayoutChange);
        return () => {
            resizeObserver.disconnect();
            mobileQuery.removeEventListener('change', handleLayoutChange);
        };
    }, [dir.id, fileTreeView]);

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
                    <PanHorizontally
                        className={styles.panSidebar}
                        onPanStart={() => {
                            startWidthRef.current = width;
                            setIsDragging(true);
                        }}
                        onPan={(deltaX) => {
                            if (startWidthRef.current !== null) {
                                resize(startWidthRef.current + deltaX);
                            }
                        }}
                        onPanEnd={endResize}
                        handleProps={{
                            className: styles.divider,
                            title: 'Ziehen zum Vergrössern oder Verkleinern; Doppelklick zum Ein- oder Ausklappen',
                            onDoubleClick: toggle
                        }}
                    >
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
                    </PanHorizontally>
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
