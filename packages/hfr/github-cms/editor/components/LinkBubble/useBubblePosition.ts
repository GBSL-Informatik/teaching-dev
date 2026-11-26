import type { EditorView } from 'prosemirror-view';
import React from 'react';

export interface BubblePosition {
    top: number;
    left: number;
}

const GAP_PX = 4;

/**
 * Places the bubble below the position `pos` in the document, relative to the container
 * (`position: absolute`) and kept inside it. The placement is updated when the container
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
            const maxLeft = Math.max(0, bounds.width - bubble.offsetWidth);
            setPosition({
                top: start.bottom - bounds.top + GAP_PX,
                left: Math.min(start.left - bounds.left, maxLeft)
            });
        };
        update();
        const resizeObserver = new ResizeObserver(update);
        resizeObserver.observe(container);
        resizeObserver.observe(bubble);
        return () => resizeObserver.disconnect();
    }, [view, container, pos, bubble]);

    return position;
};
