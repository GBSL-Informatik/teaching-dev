interface Point {
    x: number;
    y: number;
}

/**
 * Shared state of one conversion: the origin, to which all positions are relative, and the element ids.
 */
export default class ConversionContext {
    readonly origin: Point;
    private idCount = 0;

    constructor(root: Element) {
        const rootRect = root.getBoundingClientRect();
        this.origin = { x: rootRect.left, y: rootRect.top };
    }

    toScene(rect: DOMRect): Point {
        return { x: rect.left - this.origin.x, y: rect.top - this.origin.y };
    }

    nextId(): string {
        this.idCount += 1;
        return `tdev-${this.idCount}`;
    }
}
