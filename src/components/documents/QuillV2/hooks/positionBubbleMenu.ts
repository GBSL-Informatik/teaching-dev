import type Quill from 'quill';
import type { Bounds } from 'quill';
import type { BubbleTooltip } from 'quill/themes/bubble';

const VIEWPORT_MARGIN = 8;
const MENU_GAP = 10;
const COMPACT_VIEWPORT_WIDTH = 996;

interface Placement {
    top: number;
    flipped: boolean;
}

export const positionBubbleMenu = (quill: Quill, tooltip: BubbleTooltip, reference: Bounds): number => {
    const viewport = window.visualViewport;
    const viewportWidth = viewport?.width ?? window.innerWidth;
    const viewportHeight = viewport?.height ?? window.innerHeight;
    const minLeft = (viewport?.offsetLeft ?? 0) + VIEWPORT_MARGIN;
    const minTop = (viewport?.offsetTop ?? 0) + VIEWPORT_MARGIN;
    const maxRight = minLeft + viewportWidth - 2 * VIEWPORT_MARGIN;
    const maxBottom = minTop + viewportHeight - 2 * VIEWPORT_MARGIN;
    const compact = viewportWidth <= COMPACT_VIEWPORT_WIDTH;
    const menu = tooltip.root;

    // Measure the wrapped toolbar before positioning, then keep its width stable as it moves.
    menu.style.maxWidth = `${Math.max(0, viewportWidth - 2 * VIEWPORT_MARGIN)}px`;
    menu.style.left = '0px';
    menu.style.width = '';
    menu.style.width = `${menu.offsetWidth}px`;
    const width = menu.offsetWidth;
    const height = menu.offsetHeight;
    const container = quill.container.getBoundingClientRect();
    const selectionTop = container.top + reference.top;
    const selectionBottom = container.top + reference.bottom;
    const selectionCenter = container.left + reference.left + reference.width / 2;

    const findPlacement = (top: number, bottom: number): Placement | undefined => {
        const above = top - height - MENU_GAP;
        const below = bottom + MENU_GAP;
        if (compact && above >= minTop && above + height <= maxBottom) {
            return { top: above, flipped: true };
        }
        if (below >= minTop && below + height <= maxBottom) {
            return { top: below, flipped: false };
        }
        if (above >= minTop && above + height <= maxBottom) {
            return { top: above, flipped: true };
        }
    };

    // Small editors leave room for the menu outside the text area on mobile.
    const editor = quill.root.getBoundingClientRect();
    const placement = (compact ? findPlacement(editor.top, editor.bottom) : undefined) ??
        findPlacement(selectionTop, selectionBottom) ?? {
            top: Math.max(minTop, Math.min(selectionBottom + MENU_GAP, maxBottom - height)),
            flipped: false
        };
    const idealLeft = selectionCenter - width / 2;
    const left = Math.max(minLeft, Math.min(idealLeft, maxRight - width));

    menu.classList.toggle('ql-flip', placement.flipped);
    menu.style.top = '0px';
    // Account for Quill's flip transform and scroll margin when translating viewport coordinates.
    const origin = menu.getBoundingClientRect();
    menu.style.left = `${left - origin.left}px`;
    menu.style.top = `${placement.top - origin.top}px`;

    const arrow = menu.querySelector<HTMLElement>('.ql-tooltip-arrow');
    if (arrow) {
        arrow.style.left = `${Math.max(arrow.offsetWidth, Math.min(selectionCenter - left, width - arrow.offsetWidth))}px`;
        arrow.style.marginLeft = `${-arrow.offsetWidth / 2}px`;
    }
    return left - idealLeft;
};
