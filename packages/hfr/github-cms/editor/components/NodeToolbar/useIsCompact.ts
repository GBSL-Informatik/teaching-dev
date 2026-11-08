import React from 'react';

/**
 * Whether the content of the container must be shown compact, because it does not fit inline.
 * The required width is remembered while the content is inline, so the container switches
 * back as soon as it is wide enough again.
 * @param content the inline content, `null` while it is shown compact
 */
export const useIsCompact = (container: HTMLElement | null, content: HTMLElement | null) => {
    const [isCompact, setIsCompact] = React.useState(false);
    const requiredWidth = React.useRef(0);

    React.useLayoutEffect(() => {
        if (!container) {
            return;
        }
        const update = () => {
            if (content) {
                requiredWidth.current = container.scrollWidth;
            }
            setIsCompact(container.clientWidth < requiredWidth.current);
        };
        update();
        const resizeObserver = new ResizeObserver(update);
        resizeObserver.observe(container);
        if (content) {
            resizeObserver.observe(content);
        }
        return () => resizeObserver.disconnect();
    }, [container, content]);

    return isCompact;
};
