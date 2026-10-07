import { useStore } from '@tdev-hooks/useStore';
import { FILE_TREE_DEFAULT_WIDTH, FILE_TREE_MIN_WIDTH } from '@tdev-stores/ViewStores';
import React from 'react';

const DIVIDER_WIDTH = 16;
const MIN_DOCUMENT_WIDTH = 200;
const MOBILE_MEDIA_QUERY = '(max-width: 768px)';

export const useFileTreeResize = (rootId: string) => {
    const viewStore = useStore('viewStore');
    const width = viewStore.getFileTreeWidth(rootId);
    const isCollapsed = width === 0;
    const containerRef = React.useRef<HTMLDivElement>(null);
    const dragRef = React.useRef<{ pointerId: number; startX: number; startWidth: number } | null>(null);
    const [isDragging, setIsDragging] = React.useState(false);

    const maxWidth = () =>
        Math.max(0, (containerRef.current?.clientWidth ?? 0) - DIVIDER_WIDTH - MIN_DOCUMENT_WIDTH);
    const resize = (nextWidth: number) => viewStore.setFileTreeWidth(rootId, nextWidth, maxWidth());
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
                viewStore.setFileTreeWidth(rootId, viewStore.getFileTreeWidth(rootId), maxWidth());
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
    }, [rootId, viewStore]);

    const separatorProps: React.HTMLAttributes<HTMLDivElement> = {
        role: 'separator',
        'aria-label': 'Breite der Seitenleiste',
        'aria-orientation': 'vertical',
        'aria-valuemin': 0,
        'aria-valuenow': width,
        'aria-valuetext': isCollapsed ? 'Eingeklappt' : `${Math.round(width)} Pixel`,
        tabIndex: 0,
        title: 'Ziehen zum Vergrößern oder Verkleinern; Doppelklick zum Ein- oder Ausklappen',
        onPointerDown: (event) => {
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
        },
        onPointerMove: (event) => {
            const drag = dragRef.current;
            if (drag?.pointerId === event.pointerId) {
                resize(drag.startWidth + event.clientX - drag.startX);
            }
        },
        onPointerUp: endDrag,
        onPointerCancel: endDrag,
        onLostPointerCapture: endDrag,
        onDoubleClick: toggle,
        onKeyDown: (event) => {
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
        }
    };

    return { containerRef, width, isCollapsed, isDragging, separatorProps };
};
