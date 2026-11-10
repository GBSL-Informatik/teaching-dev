import React from 'react';
import { useCmsStore } from '../../../hooks/useCmsStore';

/* the nav counts as hidden when it is behind the sticky editor toolbar */
const TOOLBAR_HEIGHT = '-48px';

/**
 * Reports to the view store whether the element is on the screen: when it is not,
 * the editor toolbar shows the file tree toggle, see `EditorHeader`.
 */
const useReportVisibility = (element: HTMLElement | null) => {
    const { viewStore } = useCmsStore();
    React.useEffect(() => {
        if (!element) {
            return;
        }
        const observer = new IntersectionObserver(
            ([entry]) => viewStore.setIsEditorNavVisible(entry.isIntersecting),
            { rootMargin: `${TOOLBAR_HEIGHT} 0px 0px 0px` }
        );
        observer.observe(element);
        return () => {
            observer.disconnect();
            viewStore.setIsEditorNavVisible(true);
        };
    }, [element, viewStore]);
};

export default useReportVisibility;
