import React from 'react';

export interface FloatingPlacement {
    left: number;
    top?: number;
    bottom?: number;
}

const GAP = 4;
const VIEWPORT_MARGIN = 8;

/**
 * Centers the floating element horizontally below the anchor, or above it when there is
 * not enough space below. The floating element is kept inside the viewport.
 * The values are meant for `position: fixed`.
 */
export const placeCentered = (anchor: DOMRect, width: number, height: number): FloatingPlacement => {
    const centeredLeft = anchor.left + anchor.width / 2 - width / 2;
    const maxLeft = window.innerWidth - width - VIEWPORT_MARGIN;
    const left = Math.max(VIEWPORT_MARGIN, Math.min(centeredLeft, maxLeft));
    const spaceBelow = window.innerHeight - anchor.bottom;
    const spaceAbove = anchor.top;
    if (spaceBelow >= height + GAP || spaceBelow >= spaceAbove) {
        return { left, top: anchor.bottom + GAP };
    }
    return { left, bottom: window.innerHeight - anchor.top + GAP };
};

/**
 * Keeps a floating element (`position: fixed`) placed at its anchor while it is open:
 * the placement is updated when the page is scrolled or resized and when the size
 * of the floating element changes.
 */
export const useFloatingPlacement = (anchor: HTMLElement | null, floating: HTMLElement | null) => {
    const [placement, setPlacement] = React.useState<FloatingPlacement | null>(null);

    React.useLayoutEffect(() => {
        if (!anchor || !floating) {
            setPlacement(null);
            return;
        }
        const update = () => {
            setPlacement(
                placeCentered(anchor.getBoundingClientRect(), floating.offsetWidth, floating.offsetHeight)
            );
        };
        update();
        const resizeObserver = new ResizeObserver(update);
        resizeObserver.observe(floating);
        window.addEventListener('resize', update);
        window.addEventListener('scroll', update, true);
        return () => {
            resizeObserver.disconnect();
            window.removeEventListener('resize', update);
            window.removeEventListener('scroll', update, true);
        };
    }, [anchor, floating]);

    return placement;
};
