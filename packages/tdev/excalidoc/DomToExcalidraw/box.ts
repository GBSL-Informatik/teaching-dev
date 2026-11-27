import { toExcalidrawColor } from './colors';
import ConversionContext from './ConversionContext';
import { Roundness, Skeleton } from './types';

type Side = 'Top' | 'Right' | 'Bottom' | 'Left';
const SIDES: Side[] = ['Top', 'Right', 'Bottom', 'Left'];
const IFRAME_STROKE_COLOR = '#868e96';

interface Border {
    side: Side;
    width: number;
    color: string;
}

/**
 * Converts the background and borders of an element, e.g. of an admonition or a table cell.
 * Borders on single sides (like the colored left border of admonitions) become thin filled rectangles.
 */
export const boxSkeletons = (
    element: Element,
    style: CSSStyleDeclaration,
    context: ConversionContext
): Skeleton[] => {
    const rect = element.getBoundingClientRect();
    const backgroundColor = toExcalidrawColor(style.backgroundColor);
    const borders = visibleBorders(style, context);
    const hasUniformBorder = borders.length === SIDES.length && isUniform(borders);
    const skeletons: Skeleton[] = [];

    if (backgroundColor !== 'transparent' || hasUniformBorder) {
        skeletons.push({
            ...rectangle(rect, context),
            backgroundColor,
            strokeColor: hasUniformBorder ? borders[0].color : 'transparent',
            strokeWidth: hasUniformBorder ? borders[0].width : 1,
            roundness: parseFloat(style.borderTopLeftRadius) > 0 ? { type: Roundness.Adaptive } : null
        });
    }
    if (!hasUniformBorder) {
        skeletons.push(...borders.map((border) => borderSkeleton(rect, border, context)));
    }
    return skeletons;
};

/**
 * Embedded pages can not be rendered to an image, they become a box linking to the page.
 */
export const iframeSkeleton = (iframe: HTMLIFrameElement, context: ConversionContext): Skeleton => {
    return {
        ...rectangle(iframe.getBoundingClientRect(), context),
        backgroundColor: 'transparent',
        strokeColor: IFRAME_STROKE_COLOR,
        strokeStyle: 'dashed',
        link: iframe.src,
        label: { text: iframe.title || iframe.src }
    };
};

const visibleBorders = (style: CSSStyleDeclaration, context: ConversionContext): Border[] => {
    const borderProperty = (side: Side, property: 'width' | 'color' | 'style') =>
        style.getPropertyValue(`border-${side.toLowerCase()}-${property}`);

    return SIDES.filter((side) => borderProperty(side, 'style') !== 'none')
        .map((side) => ({
            side,
            width: parseFloat(borderProperty(side, 'width')),
            color: toExcalidrawColor(borderProperty(side, 'color'))
        }))
        .filter((border) => border.width > 0 && border.color !== 'transparent');
};

const isUniform = (borders: Border[]) =>
    borders.every((border) => border.width === borders[0].width && border.color === borders[0].color);

const borderSkeleton = (rect: DOMRect, border: Border, context: ConversionContext): Skeleton => {
    const { side, width, color } = border;
    const borderRect = {
        Top: new DOMRect(rect.left, rect.top, rect.width, width),
        Right: new DOMRect(rect.right - width, rect.top, width, rect.height),
        Bottom: new DOMRect(rect.left, rect.bottom - width, rect.width, width),
        Left: new DOMRect(rect.left, rect.top, width, rect.height)
    }[side];
    return {
        ...rectangle(borderRect, context),
        backgroundColor: color,
        strokeColor: 'transparent',
        roundness: null
    };
};

const rectangle = (rect: DOMRect, context: ConversionContext) => {
    return {
        type: 'rectangle' as const,
        id: context.nextId(),
        ...context.toScene(rect),
        width: rect.width,
        height: rect.height,
        fillStyle: 'solid' as const,
        roughness: 0
    };
};
