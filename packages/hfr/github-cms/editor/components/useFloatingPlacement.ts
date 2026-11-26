import React from 'react';

export interface FloatingPlacement {
    left: number;
    top: number;
    /** the width of the anchor, see `matchAnchorWidth` */
    minWidth?: number;
}

/** the distance between a floating element and its anchor */
export const GAP_PX = 4;
const VIEWPORT_MARGIN = 8;

/**
 * The vertical bounds of the visible part of the viewport. On phones, the on-screen keyboard
 * covers the bottom of the page without changing `window.innerHeight`.
 */
export const visibleViewport = () => {
    const viewport = window.visualViewport;
    if (!viewport) {
        return { top: 0, bottom: window.innerHeight };
    }
    return { top: viewport.offsetTop, bottom: viewport.offsetTop + viewport.height };
};

/** whether the floating element is placed above the anchor: it would be covered below and fits better above */
export const shouldPlaceAbove = (anchor: { top: number; bottom: number }, height: number) => {
    const visible = visibleViewport();
    const spaceBelow = visible.bottom - anchor.bottom;
    const spaceAbove = anchor.top - visible.top;
    return spaceBelow < height + GAP_PX && spaceAbove > spaceBelow;
};

/** calls `update` when the page is scrolled or resized, also when the on-screen keyboard opens */
export const onViewportChange = (update: () => void) => {
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    window.visualViewport?.addEventListener('resize', update);
    window.visualViewport?.addEventListener('scroll', update);
    return () => {
        window.removeEventListener('resize', update);
        window.removeEventListener('scroll', update, true);
        window.visualViewport?.removeEventListener('resize', update);
        window.visualViewport?.removeEventListener('scroll', update);
    };
};

/**
 * Centers the floating element horizontally below the anchor, or above it when there is
 * not enough space below. The floating element is kept inside the viewport.
 * The values are meant for `position: fixed`.
 */
export const placeCentered = (anchor: DOMRect, width: number, height: number): FloatingPlacement => {
    const centeredLeft = anchor.left + anchor.width / 2 - width / 2;
    const maxLeft = window.innerWidth - width - VIEWPORT_MARGIN;
    const left = Math.max(VIEWPORT_MARGIN, Math.min(centeredLeft, maxLeft));
    if (!shouldPlaceAbove(anchor, height)) {
        return { left, top: anchor.bottom + GAP_PX };
    }
    return { left, top: anchor.top - height - GAP_PX };
};

/**
 * Keeps a floating element (`position: fixed`) placed at its anchor while it is open:
 * the placement is updated when the page is scrolled or resized and when the size
 * of the floating element or of the anchor changes.
 * @param matchAnchorWidth the floating element is at least as wide as the anchor, e.g. a dropdown below an input
 */
export const useFloatingPlacement = (
    anchor: HTMLElement | null,
    floating: HTMLElement | null,
    matchAnchorWidth = false
) => {
    const [placement, setPlacement] = React.useState<FloatingPlacement | null>(null);

    React.useLayoutEffect(() => {
        if (!anchor || !floating) {
            setPlacement(null);
            return;
        }
        const update = () => {
            const anchorRect = anchor.getBoundingClientRect();
            const position = placeCentered(anchorRect, floating.offsetWidth, floating.offsetHeight);
            setPlacement(matchAnchorWidth ? { ...position, minWidth: anchorRect.width } : position);
        };
        update();
        const resizeObserver = new ResizeObserver(update);
        resizeObserver.observe(floating);
        resizeObserver.observe(anchor);
        const removeViewportListeners = onViewportChange(update);
        return () => {
            resizeObserver.disconnect();
            removeViewportListeners();
        };
    }, [anchor, floating, matchAnchorWidth]);

    return placement;
};
