import { boxSkeletons, iframeSkeleton } from './box';
import ConversionContext from './ConversionContext';
import { isIgnored, isInlineFlow, isReplaced, isVisible } from './dom';
import { imageSkeleton } from './image';
import { codeSkeleton, textSkeletons } from './text';
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

    if (element instanceof HTMLIFrameElement) {
        return [iframeSkeleton(element, context)];
    }
    if (isReplaced(element)) {
        return withOptional([], await imageSkeleton(element, context));
    }
    const boxes = boxSkeletons(element, style, context);
    if (element instanceof HTMLPreElement) {
        return withOptional(boxes, codeSkeleton(element, style, context));
    }
    const text = [...boxes, ...textSkeletons(element, style, context)];
    return [...text, ...(await convertChildren(element, context))];
};

const withOptional = (skeletons: Skeleton[], skeleton: Skeleton | undefined) =>
    skeleton ? [...skeletons, skeleton] : skeletons;

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
