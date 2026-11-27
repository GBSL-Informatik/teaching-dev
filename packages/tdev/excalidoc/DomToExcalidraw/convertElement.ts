import ConversionContext from './ConversionContext';
import { isIgnored, isInlineFlow, isVisible } from './dom';
import { textSkeleton } from './text';
import { Skeleton } from './types';

/**
 * Converts a rendered block and its descendants to Excalidraw element skeletons, in paint order.
 */
export const convertElement = async (element: Element, context: ConversionContext): Promise<Skeleton[]> => {
    if (isIgnored(element)) {
        return [];
    }
    const style = getComputedStyle(element);
    if (!isVisible(element, style)) {
        return [];
    }

    const text = textSkeleton(element, style, context);
    const children = await convertChildren(element, context);
    return text ? [text, ...children] : children;
};

/**
 * Inline children are part of the text of their parent, but may contain blocks or images.
 */
const convertChildren = async (element: Element, context: ConversionContext): Promise<Skeleton[]> => {
    const skeletons: Skeleton[] = [];
    for (const child of Array.from(element.children)) {
        const isInline = !isIgnored(child) && isInlineFlow(child, getComputedStyle(child));
        const converted = isInline
            ? await convertChildren(child, context)
            : await convertElement(child, context);
        skeletons.push(...converted);
    }
    return skeletons;
};
