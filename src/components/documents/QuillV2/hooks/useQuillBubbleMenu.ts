import type Quill from 'quill';
import type { Bounds } from 'quill';
import type BubbleTheme from 'quill/themes/bubble';
import React from 'react';
import { positionBubbleMenu } from './positionBubbleMenu';

export const useQuillBubbleMenu: (
    quill: Quill | undefined,
    containerRef: React.RefObject<HTMLDivElement | null>,
    theme: 'snow' | 'bubble'
) => void = (
    quill: Quill | undefined,
    containerRef: React.RefObject<HTMLDivElement | null>,
    theme: 'snow' | 'bubble'
): void => {
    React.useEffect((): (() => void) | undefined => {
        const element = containerRef.current;
        if (!element || !quill || theme !== 'bubble') {
            return;
        }
        const { tooltip } = quill.theme as BubbleTheme;
        if (!tooltip) {
            return;
        }
        const menu = tooltip.root;
        const arrow = menu.querySelector<HTMLElement>('.ql-tooltip-arrow');
        const originalPosition = tooltip.position;
        const originalStyles = {
            left: menu.style.left,
            top: menu.style.top,
            width: menu.style.width,
            maxWidth: menu.style.maxWidth
        };
        const originalArrowStyle = arrow?.getAttribute('style');
        const originalFlip = menu.classList.contains('ql-flip');
        const handlePosition = (reference: Bounds): number => positionBubbleMenu(quill, tooltip, reference);
        tooltip.position = handlePosition;

        let frame: number | undefined;
        let disposed = false;
        const handleReposition = (): void => {
            if (disposed || frame !== undefined || menu.classList.contains('ql-hidden')) {
                return;
            }
            frame = window.requestAnimationFrame(() => {
                frame = undefined;
                if (disposed || menu.classList.contains('ql-hidden')) {
                    return;
                }
                const range = quill.getSelection() ?? quill.selection.savedRange;
                const bounds = quill.getBounds(range);
                if (bounds) {
                    tooltip.position(bounds);
                }
            });
        };

        // Show Quill's formatting menu instead of the browser context menu on touch devices.
        const handleContextMenu = (event: MouseEvent): void => {
            if (!quill.isEnabled() || !(event.target instanceof Node) || !quill.root.contains(event.target)) {
                return;
            }
            event.preventDefault();
            const range = quill.getSelection() ?? quill.selection.savedRange;
            const bounds = quill.getBounds(range);
            tooltip.show();
            if (bounds) {
                tooltip.position(bounds);
            }
        };
        const resizeObserver = new ResizeObserver(handleReposition);
        resizeObserver.observe(menu);
        resizeObserver.observe(quill.container);
        const viewport = window.visualViewport;
        window.addEventListener('resize', handleReposition);
        window.addEventListener('scroll', handleReposition, true);
        viewport?.addEventListener('resize', handleReposition);
        viewport?.addEventListener('scroll', handleReposition);
        element.addEventListener('contextmenu', handleContextMenu);

        return (): void => {
            disposed = true;
            if (frame !== undefined) {
                window.cancelAnimationFrame(frame);
            }
            resizeObserver.disconnect();
            window.removeEventListener('resize', handleReposition);
            window.removeEventListener('scroll', handleReposition, true);
            viewport?.removeEventListener('resize', handleReposition);
            viewport?.removeEventListener('scroll', handleReposition);
            element.removeEventListener('contextmenu', handleContextMenu);
            if (tooltip.position === handlePosition) {
                tooltip.position = originalPosition;
                Object.assign(menu.style, originalStyles);
                menu.classList.toggle('ql-flip', originalFlip);
                if (arrow) {
                    if (originalArrowStyle === null || originalArrowStyle === undefined) {
                        arrow.removeAttribute('style');
                    } else {
                        arrow.setAttribute('style', originalArrowStyle);
                    }
                }
            }
        };
    }, [quill, containerRef, theme]);
};
