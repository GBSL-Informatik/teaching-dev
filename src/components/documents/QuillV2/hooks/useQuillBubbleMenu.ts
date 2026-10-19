import type Quill from 'quill';
import type BubbleTheme from 'quill/themes/bubble';
import React from 'react';

export const useQuillBubbleMenu = (
    quill: Quill | undefined,
    containerRef: React.RefObject<HTMLDivElement | null>,
    theme: 'snow' | 'bubble'
): void => {
    React.useEffect(() => {
        const element = containerRef.current;
        if (!element || !quill || theme !== 'bubble') {
            return;
        }
        // Show Quill's formatting menu instead of the browser context menu on touch devices.
        const handleContextMenu = (event: MouseEvent) => {
            event.preventDefault();
            try {
                const { tooltip } = quill.theme as BubbleTheme;
                tooltip.edit();
                tooltip.show();
            } catch (error) {
                console.log(error);
            }
        };
        element.addEventListener('contextmenu', handleContextMenu);
        return () => element.removeEventListener('contextmenu', handleContextMenu);
    }, [quill, containerRef, theme]);
};
