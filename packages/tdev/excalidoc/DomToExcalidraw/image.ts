import blobToBase64 from '@tdev-models/helpers/blobToBase64';
import ConversionContext from './ConversionContext';
import { Skeleton } from './types';

/** rasterized elements stay sharp when they are scaled up on the canvas */
const RASTER_PIXEL_RATIO = 2;

/**
 * Converts an image, an inline svg, a canvas, a video or a rasterized element
 * to an image element with an embedded file.
 */
export const imageSkeleton = async (
    element: Element,
    context: ConversionContext
): Promise<Skeleton | undefined> => {
    const dataUrl = await toDataUrl(element);
    if (!dataUrl) {
        return;
    }
    const rect = element.getBoundingClientRect();
    return {
        type: 'image',
        id: context.nextId(),
        ...context.toScene(rect),
        width: rect.width,
        height: rect.height,
        fileId: context.addFile(dataUrl),
        status: 'saved'
    };
};

const toDataUrl = async (element: Element): Promise<string | undefined> => {
    try {
        if (element instanceof HTMLImageElement) {
            return await fetchAsDataUrl(element.currentSrc || element.src);
        }
        if (element instanceof SVGSVGElement) {
            return await svgToDataUrl(element);
        }
        if (element instanceof HTMLCanvasElement) {
            return element.toDataURL();
        }
        if (element instanceof HTMLVideoElement) {
            return currentVideoFrame(element);
        }
        if (element instanceof HTMLElement) {
            return await rasterize(element);
        }
    } catch (error) {
        // e.g. a cross-origin image or a tainted canvas: the rest of the page is still copied
        console.warn('Could not embed image', element, error);
    }
};

const fetchAsDataUrl = async (src: string) => {
    const response = await fetch(src);
    if (!response.ok) {
        throw new Error(`${response.status} ${response.statusText}`);
    }
    return blobToBase64(await response.blob());
};

const currentVideoFrame = (video: HTMLVideoElement) => {
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0);
    return canvas.toDataURL();
};

/**
 * Renders elements that cannot be split into text and boxes, e.g. KaTeX formulas, to a png.
 */
const rasterize = async (element: HTMLElement) => {
    const { toPng } = await import('html-to-image');
    // html-to-image measures with `clientWidth`, which is 0 for inline elements like KaTeX formulas
    const { width, height } = element.getBoundingClientRect();
    return toPng(element, {
        width,
        height,
        pixelRatio: RASTER_PIXEL_RATIO,
        style: { display: 'inline-block', margin: '0' }
    });
};

/**
 * Inline svgs often depend on the page: they are sized by css and colored with `currentColor`.
 */
const svgToDataUrl = (svg: SVGSVGElement) => {
    const rect = svg.getBoundingClientRect();
    const clone = svg.cloneNode(true) as SVGSVGElement;
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    clone.setAttribute('width', `${rect.width}`);
    clone.setAttribute('height', `${rect.height}`);
    clone.style.color = getComputedStyle(svg).color;
    const markup = new XMLSerializer().serializeToString(clone);
    return blobToBase64(new Blob([markup], { type: 'image/svg+xml' }));
};
