import React from 'react';

/** whether files of the file system are dragged, and not e.g. a block of the editor */
const hasFiles = (event: React.DragEvent) => event.dataTransfer.types.includes('Files');

/**
 * Makes an element a drop target for files of the file system.
 * Without `onDrop`, the element is no drop target.
 */
export const useFileDrop = (onDrop?: (files: File[]) => void) => {
    const [isDragOver, setIsDragOver] = React.useState(false);
    if (!onDrop) {
        return { isDragOver: false, dropHandlers: undefined };
    }

    const handleDragOver: React.DragEventHandler = (event) => {
        if (!hasFiles(event)) {
            return;
        }
        event.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave: React.DragEventHandler = (event) => {
        // `dragleave` fires as well when the pointer moves onto a child of the element
        if (event.currentTarget.contains(event.relatedTarget as Node | null)) {
            return;
        }
        setIsDragOver(false);
    };

    const handleDrop: React.DragEventHandler = (event) => {
        if (!hasFiles(event)) {
            return;
        }
        event.preventDefault();
        setIsDragOver(false);
        onDrop(Array.from(event.dataTransfer.files));
    };

    return {
        isDragOver,
        dropHandlers: { onDragOver: handleDragOver, onDragLeave: handleDragLeave, onDrop: handleDrop }
    };
};
