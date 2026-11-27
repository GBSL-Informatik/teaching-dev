import ConversionContext from './ConversionContext';
import { convertElement } from './convertElement';
import { Scene, Skeleton } from './types';

/**
 * Excalidraw converts the skeletons of this clipboard type to elements when pasting,
 * see `parseClipboard` in `@excalidraw/excalidraw/clipboard`. Text is then measured with the fonts of the canvas.
 */
const CLIPBOARD_TYPE = 'excalidraw-api/clipboard';

/**
 * Copies the blocks of the article to the clipboard, as Excalidraw elements.
 * When the user selected a part of the article, only the selected blocks are copied.
 */
export const copyAsExcalidraw = async (article: Element) => {
    const blocks = selectedBlocks(article) ?? Array.from(article.children);
    const scene = await convertToScene(article, blocks);
    await navigator.clipboard.writeText(JSON.stringify({ type: CLIPBOARD_TYPE, ...scene }));
    return scene.elements.length;
};

const convertToScene = async (article: Element, blocks: Element[]): Promise<Scene> => {
    const context = new ConversionContext(article);
    const elements: Skeleton[] = [];
    for (const block of blocks) {
        elements.push(...(await convertElement(block, context)));
    }
    return { elements, files: {} };
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
