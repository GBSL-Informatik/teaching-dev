import React from 'react';
import { useCmsStore } from '../../../hooks/useCmsStore';

/**
 * The editor toolbar sticks at this offset, see `components/styles.module.scss`.
 * Above it, the scrolled content is still visible.
 */
const toolbarTopOffset = (element: HTMLElement) => {
    const offset = getComputedStyle(element).getPropertyValue('--cms-toolbar-top-offset').trim();
    return offset || '0px';
};

/**
 * Reports to the view store whether the element is on the screen: when it has vanished
 * completely (behind the sticky editor toolbar or out of the screen), the editor toolbar
 * shows the file tree toggle, see `EditorHeader`.
 */
const useReportVisibility = (element: HTMLElement | null) => {
    const { viewStore } = useCmsStore();
    React.useEffect(() => {
        if (!element) {
            return;
        }
        const observer = new IntersectionObserver(
            ([entry]) => viewStore.setIsEditorNavVisible(entry.isIntersecting),
            { rootMargin: `-${toolbarTopOffset(element)} 0px 0px 0px` }
        );
        observer.observe(element);
        return () => {
            observer.disconnect();
            viewStore.setIsEditorNavVisible(true);
        };
    }, [element, viewStore]);
};

export default useReportVisibility;
