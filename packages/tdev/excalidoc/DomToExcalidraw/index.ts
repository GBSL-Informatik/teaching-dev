import type { ExcalidrawElement } from '@excalidraw/excalidraw/element/types';
import ConversionContext from './ConversionContext';
import { convertElement } from './convertElement';
import { Slide, splitIntoSlides } from './slides';
import { Scene, Skeleton } from './types';

/**
 * The clipboard format Excalidraw writes itself when copying elements.
 */
const CLIPBOARD_TYPE = 'excalidraw/clipboard';

/**
 * Copies the blocks of the article to the clipboard, as Excalidraw elements.
 * When the user selected a part of the article, only the selected blocks are copied.
 */
export const copyAsExcalidraw = async (article: Element) => {
    const blocks = selectedBlocks(article) ?? Array.from(article.children);
    const [scene, Lib] = await Promise.all([
        withLightTheme(() => convertToScene(article, blocks)),
        import('@excalidraw/excalidraw')
    ]);
    // ids are kept to find the skeletons again, Excalidraw generates new ids when pasting anyway
    const converted = Lib.convertToExcalidrawElements(scene.elements, { regenerateIds: false });
    const elements = withExplicitTextWidths(converted, scene.elements);
    await navigator.clipboard.writeText(
        JSON.stringify({ type: CLIPBOARD_TYPE, elements, files: scene.files })
    );
};

/**
 * Excalidraw canvases are light (its dark theme inverts their colors), so the page is converted in its light theme.
 * Converting dark colors is not possible: they can not be told apart from colors that do not depend on the theme.
 * The page flashes light while converting, also during the slower embedding of images; this is accepted.
 * Colors set by JavaScript (e.g. the syntax theme of code blocks, see `useColorMode`) keep the current theme.
 */
const withLightTheme = async <T>(convert: () => Promise<T>): Promise<T> => {
    const root = document.documentElement;
    const theme = root.getAttribute('data-theme');
    root.setAttribute('data-theme', 'light');
    try {
        return await convert();
    } finally {
        if (theme === null) {
            root.removeAttribute('data-theme');
        } else {
            root.setAttribute('data-theme', theme);
        }
    }
};

const convertToScene = async (article: Element, blocks: Element[]): Promise<Scene> => {
    const context = new ConversionContext(article);
    const elements: Skeleton[] = [];
    for (const [slideIndex, slide] of splitIntoSlides(blocks).entries()) {
        context.startSlide(slide.blocks[0], slideIndex);
        elements.push(...(await convertSlide(slide, context)));
    }
    return { elements, files: context.files };
};

/**
 * Converts the blocks of the slide, followed by a frame around them.
 */
const convertSlide = async (slide: Slide, context: ConversionContext): Promise<Skeleton[]> => {
    const elements: Skeleton[] = [];
    for (const block of slide.blocks) {
        elements.push(...(await convertElement(block, context)));
    }
    if (elements.length === 0) {
        return [];
    }
    const frame: Skeleton = {
        type: 'frame',
        id: context.nextId(),
        name: slide.name,
        children: elements.map((element) => element.id!)
    };
    return [...elements, frame];
};

/**
 * Excalidraw measures the text of skeletons itself and ignores their width.
 * Its fonts are not loaded on this page, so explicit widths (see `codeSkeleton`) are applied afterwards.
 */
const withExplicitTextWidths = (
    elements: readonly ExcalidrawElement[],
    skeletons: Skeleton[]
): ExcalidrawElement[] => {
    const explicitWidths = new Map<string, number>();
    for (const skeleton of skeletons) {
        if (skeleton.type === 'text' && skeleton.id && skeleton.width !== undefined) {
            explicitWidths.set(skeleton.id, skeleton.width);
        }
    }
    return elements.map((element) => {
        const width = explicitWidths.get(element.id);
        return width === undefined ? element : { ...element, width };
    });
};

const selectedBlocks = (article: Element): Element[] | undefined => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
        return;
    }
    const range = selection.getRangeAt(0);
    if (!article.contains(range.commonAncestorContainer)) {
        return;
    }
    return Array.from(article.children).filter((block) => range.intersectsNode(block));
};
