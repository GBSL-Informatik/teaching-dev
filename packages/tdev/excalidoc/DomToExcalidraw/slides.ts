export interface Slide {
    name: string;
    blocks: Element[];
}

/**
 * Starts a new slide at every `h2`. The blocks before the first `h2` (e.g. the title) form a slide of their own.
 */
export const splitIntoSlides = (blocks: Element[]): Slide[] => {
    const slides: Slide[] = [];
    for (const block of blocks) {
        const currentSlide = slides.at(-1);
        if (!currentSlide || block.tagName === 'H2') {
            slides.push({ name: slideName(block), blocks: [block] });
            continue;
        }
        currentSlide.blocks.push(block);
    }
    return slides;
};

const slideName = (block: Element) => {
    const heading = block.matches('h1, h2') ? block : block.querySelector('h1, h2');
    // the hash link of a Docusaurus heading contains a zero width space
    return heading?.textContent?.replace(/\u200b/g, '').trim() ?? '';
};
