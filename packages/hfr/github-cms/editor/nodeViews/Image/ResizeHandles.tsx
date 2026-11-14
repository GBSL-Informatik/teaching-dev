import clsx from 'clsx';
import type React from 'react';
import styles from './styles.module.scss';

const CORNERS = ['nw', 'ne', 'sw', 'se'] as const;
type Corner = (typeof CORNERS)[number];

const MIN_WIDTH = 32;

interface Props {
    /** the resized element, its width when the drag starts is the initial width */
    target: HTMLElement | null;
    onResize: (width: number) => void;
    onResizeEnd: (width: number) => void;
}

/**
 * Handles at the corners of the target to change its width by dragging.
 * The width is limited to the width of the editor.
 */
const ResizeHandles = ({ target, onResize, onResizeEnd }: Props) => {
    const handlePointerDown = (event: React.PointerEvent<HTMLSpanElement>, corner: Corner) => {
        if (!target) {
            return;
        }
        // prevents selecting text
        event.preventDefault();
        const handleElement = event.currentTarget;
        handleElement.setPointerCapture(event.pointerId);

        const startX = event.clientX;
        const startWidth = target.getBoundingClientRect().width;
        const maxWidth = target.closest('.ProseMirror')?.clientWidth ?? Infinity;
        const direction = corner.endsWith('e') ? 1 : -1;
        const widthAt = (clientX: number) => {
            const width = startWidth + direction * (clientX - startX);
            return Math.round(Math.min(Math.max(width, MIN_WIDTH), maxWidth));
        };

        // the image node is draggable, the browser must not start dragging it while resizing
        const handleDragStart = (dragEvent: DragEvent) => dragEvent.preventDefault();
        const handlePointerMove = (moveEvent: PointerEvent) => onResize(widthAt(moveEvent.clientX));
        const handlePointerUp = (upEvent: PointerEvent) => {
            window.removeEventListener('dragstart', handleDragStart, true);
            handleElement.removeEventListener('pointermove', handlePointerMove);
            handleElement.removeEventListener('pointerup', handlePointerUp);
            handleElement.removeEventListener('pointercancel', handlePointerUp);
            onResizeEnd(widthAt(upEvent.clientX));
        };
        window.addEventListener('dragstart', handleDragStart, true);
        handleElement.addEventListener('pointermove', handlePointerMove);
        handleElement.addEventListener('pointerup', handlePointerUp);
        handleElement.addEventListener('pointercancel', handlePointerUp);
    };

    return (
        <>
            {CORNERS.map((corner) => (
                <span
                    key={corner}
                    className={clsx(styles.handle, styles[corner])}
                    // handled here, not by prosemirror, see `ReactNodeView.stopEvent`
                    data-stop-event
                    onPointerDown={(event) => handlePointerDown(event, corner)}
                />
            ))}
        </>
    );
};

export default ResizeHandles;
