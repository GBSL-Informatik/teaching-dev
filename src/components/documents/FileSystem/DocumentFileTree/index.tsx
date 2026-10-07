import { mdiChevronDown, mdiChevronUp, mdiFolderOpenOutline } from '@mdi/js';
import Icon from '@mdi/react';
import DocumentContext from '@tdev-components/documents/DocumentContext';
import { SIZE_S } from '@tdev-components/shared/iconSizes';
import { useStore } from '@tdev-hooks/useStore';
import Directory from '@tdev-models/documents/FileSystem/Directory';
import { FILE_TREE_DEFAULT_WIDTH, FILE_TREE_MIN_WIDTH } from '@tdev-stores/ViewStores';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import React from 'react';
import DocumentView from '../DocumentView';
import FileTreeComponent from './FileTreeComponent';
import WithFileTreeModel from './FileTreeComponent/WithFileTreeModel';
import styles from './styles.module.scss';

interface Props {
    dir: Directory;
    name?: string;
    height?: string;
    standalone?: boolean;
}

const DIVIDER_WIDTH = 16;
const MIN_DOCUMENT_WIDTH = 200;
const MOBILE_MEDIA_QUERY = '(max-width: 768px)';

const DocumentFileTree = observer((props: Props) => {
    const { dir } = props;
    const viewStore = useStore('viewStore');
    const width = viewStore.getFileTreeWidth(dir.id);
    const isCollapsed = width === 0;
    const selectedFile = viewStore.getSelectedFile(dir.id);
    const isMobileExpanded = viewStore.isMobileFileTreeExpanded(dir.id);
    const treeId = React.useId();
    const containerRef = React.useRef<HTMLDivElement>(null);
    const dragRef = React.useRef<{ pointerId: number; startX: number; startWidth: number } | null>(null);
    const [isDragging, setIsDragging] = React.useState(false);

    const maxWidth = () =>
        Math.max(0, (containerRef.current?.clientWidth ?? 0) - DIVIDER_WIDTH - MIN_DOCUMENT_WIDTH);
    const resize = (nextWidth: number) => viewStore.setFileTreeWidth(dir.id, nextWidth, maxWidth());
    const toggle = () => resize(isCollapsed ? FILE_TREE_DEFAULT_WIDTH : 0);
    const endDrag = () => {
        dragRef.current = null;
        setIsDragging(false);
    };

    React.useEffect(() => {
        const container = containerRef.current;
        if (!container) {
            return;
        }
        const mobileQuery = window.matchMedia(MOBILE_MEDIA_QUERY);
        const clampDesktopWidth = () => {
            // Hidden containers have no usable width yet.
            if (!mobileQuery.matches && container.clientWidth > 0) {
                viewStore.setFileTreeWidth(dir.id, viewStore.getFileTreeWidth(dir.id), maxWidth());
            }
        };
        const handleLayoutChange = () => {
            endDrag();
            clampDesktopWidth();
        };
        const resizeObserver = new ResizeObserver(clampDesktopWidth);
        resizeObserver.observe(container);
        mobileQuery.addEventListener('change', handleLayoutChange);
        return () => {
            resizeObserver.disconnect();
            mobileQuery.removeEventListener('change', handleLayoutChange);
        };
    }, [dir.id, viewStore]);

    return (
        <DocumentContext document={dir}>
            <WithFileTreeModel key={dir.localObjectId}>
                <div
                    ref={containerRef}
                    className={clsx(
                        styles.container,
                        isDragging && styles.resizing,
                        props.standalone && styles.standalone
                    )}
                    style={
                        {
                            '--file-tree-width': `${width}px`,
                            '--desktop-file-tree-height': props.height || '450px'
                        } as React.CSSProperties
                    }
                >
                    <button
                        type="button"
                        className={styles.mobileHeader}
                        aria-expanded={isMobileExpanded}
                        aria-controls={treeId}
                        title={selectedFile?.filePath}
                        onClick={() => viewStore.setMobileFileTreeExpanded(dir.id, !isMobileExpanded)}
                    >
                        <Icon path={mdiFolderOpenOutline} size={SIZE_S} />
                        <span className={styles.mobileHeaderLabel}>
                            <span className={styles.mobileHeaderTitle}>{props.name || 'Dateien'}</span>
                            <span className={styles.mobileHeaderFile}>
                                {selectedFile?.name || 'Datei auswählen'}
                            </span>
                        </span>
                        <Icon path={isMobileExpanded ? mdiChevronUp : mdiChevronDown} size={SIZE_S} />
                    </button>
                    <div
                        id={treeId}
                        className={clsx(styles.sidebar, !isMobileExpanded && styles.mobileCollapsed)}
                    >
                        <FileTreeComponent
                            className={clsx(styles.tree, isCollapsed && styles.desktopCollapsed)}
                            name={props.name}
                            height="var(--file-tree-height)"
                            onFileClick={() => viewStore.setMobileFileTreeExpanded(dir.id, false)}
                        />
                    </div>
                    <div
                        className={clsx(styles.divider, isDragging && styles.dragging)}
                        role="separator"
                        aria-label="Breite der Seitenleiste"
                        aria-orientation="vertical"
                        aria-valuemin={0}
                        aria-valuenow={width}
                        aria-valuetext={isCollapsed ? 'Eingeklappt' : `${Math.round(width)} Pixel`}
                        tabIndex={0}
                        title="Ziehen zum Vergrößern oder Verkleinern; Doppelklick zum Ein- oder Ausklappen"
                        onPointerDown={(event) => {
                            if (event.button !== 0) {
                                return;
                            }
                            event.preventDefault();
                            event.currentTarget.focus();
                            event.currentTarget.setPointerCapture(event.pointerId);
                            dragRef.current = {
                                pointerId: event.pointerId,
                                startX: event.clientX,
                                startWidth: width
                            };
                            setIsDragging(true);
                        }}
                        onPointerMove={(event) => {
                            const drag = dragRef.current;
                            if (drag?.pointerId === event.pointerId) {
                                resize(drag.startWidth + event.clientX - drag.startX);
                            }
                        }}
                        onPointerUp={endDrag}
                        onPointerCancel={endDrag}
                        onLostPointerCapture={endDrag}
                        onDoubleClick={toggle}
                        onKeyDown={(event) => {
                            switch (event.key) {
                                case 'ArrowLeft':
                                    resize(width - 20);
                                    break;
                                case 'ArrowRight':
                                    resize(isCollapsed ? FILE_TREE_MIN_WIDTH : width + 20);
                                    break;
                                case 'Home':
                                    resize(0);
                                    break;
                                case 'End':
                                    resize(maxWidth());
                                    break;
                                case 'Enter':
                                    toggle();
                                    break;
                                default:
                                    return;
                            }
                            event.preventDefault();
                        }}
                    >
                        <span className={styles.grip} aria-hidden="true">
                            <span />
                            <span />
                            <span />
                        </span>
                    </div>
                    <div className={clsx(styles.selectedFile)}>
                        <DocumentView rootDirId={dir.id} />
                        <small className={clsx(styles.filePath)}>{selectedFile?.filePath}</small>
                    </div>
                </div>
            </WithFileTreeModel>
        </DocumentContext>
    );
});

export default DocumentFileTree;
