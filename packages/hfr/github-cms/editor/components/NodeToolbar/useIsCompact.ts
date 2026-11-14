import React from 'react';

/**
 * Whether the content of the container must be shown compact, because it does not fit inline.
 * The required width is measured while the content is inline and remembered, so the container
 * switches back as soon as it is wide enough again.
 * @returns `contentRef` must be set on the element holding the inline content
 */
export const useIsCompact = (container: HTMLElement | null) => {
    const [content, setContent] = React.useState<HTMLElement | null>(null);
    const [isCompact, setIsCompact] = React.useState(false);
    const requiredWidth = React.useRef(0);

    React.useLayoutEffect(() => {
        if (!container) {
            return;
        }
        const update = () => {
            if (!isCompact) {
                requiredWidth.current = container.scrollWidth;
            }
            setIsCompact(container.clientWidth < requiredWidth.current);
        };
        update();
        const resizeObserver = new ResizeObserver(update);
        resizeObserver.observe(container);
        if (content && !isCompact) {
            resizeObserver.observe(content);
        }
        return () => resizeObserver.disconnect();
    }, [container, content, isCompact]);

    return { isCompact, contentRef: setContent };
};
