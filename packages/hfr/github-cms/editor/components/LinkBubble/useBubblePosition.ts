import type { EditorView } from 'prosemirror-view';
import React from 'react';
import { GAP_PX, onViewportChange, shouldPlaceAbove } from '../useFloatingPlacement';

export interface BubblePosition {
    top: number;
    left: number;
}

/**
 * Places the bubble below the position `pos` in the document, or above it when it would be covered
 * (e.g. by the on-screen keyboard). The position is relative to the container (`position: absolute`)
 * and kept inside it. It is updated when the page is scrolled or resized and when the container
 * (e.g. an image above finished loading) or the bubble changes its size.
 */
export const useBubblePosition = (
    view: EditorView | null,
    container: HTMLElement | null,
    pos: number | null,
    bubble: HTMLElement | null
) => {
    const [position, setPosition] = React.useState<BubblePosition | null>(null);

    React.useLayoutEffect(() => {
        if (!view || !container || pos === null || !bubble) {
            setPosition(null);
            return;
        }
        const update = () => {
            // `side = 1`: the start of the link, not the end of the previous line when the link wraps
            const start = view.coordsAtPos(pos, 1);
            const bounds = container.getBoundingClientRect();
            const height = bubble.offsetHeight;
            const top = shouldPlaceAbove(start, height) ? start.top - height - GAP_PX : start.bottom + GAP_PX;
            const maxLeft = Math.max(0, bounds.width - bubble.offsetWidth);
            setPosition({ top: top - bounds.top, left: Math.min(start.left - bounds.left, maxLeft) });
        };
        update();
        const resizeObserver = new ResizeObserver(update);
        resizeObserver.observe(container);
        resizeObserver.observe(bubble);
        const removeViewportListeners = onViewportChange(update);
        return () => {
            resizeObserver.disconnect();
            removeViewportListeners();
        };
    }, [view, container, pos, bubble]);

    return position;
};
