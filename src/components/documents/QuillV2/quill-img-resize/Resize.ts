import { BaseModule } from './BaseModule';
export default class Resize extends BaseModule {
    boxes: HTMLDivElement[] = [];
    dragBox?: HTMLElement;
    dragStartX: number = 0;
    preDragWidth: number = 0;
    private dragStyles?: { bodyCursor: string; imageCursor: string; touchAction: string };
    onCreate = () => {
        // track resize handles
        this.boxes = [];

        // add 4 resize handles
        this.addBox('nwse-resize'); // top left
        this.addBox('nesw-resize'); // top right
        this.addBox('nwse-resize'); // bottom right
        this.addBox('nesw-resize'); // bottom left

        this.positionBoxes();
    };

    onDestroy = () => {
        this.handleMouseup();
        this.boxes.forEach((box) => box.removeEventListener('pointerdown', this.handleMousedown));
        this.boxes = [];
    };

    positionBoxes = () => {
        const handleXOffset = `${-parseFloat(this.options.handleStyles.width) / 2}px`;
        const handleYOffset = `${-parseFloat(this.options.handleStyles.height) / 2}px`;

        // set the top and left for each drag handle
        [
            { left: handleXOffset, top: handleYOffset }, // top left
            { right: handleXOffset, top: handleYOffset }, // top right
            { right: handleXOffset, bottom: handleYOffset }, // bottom right
            { left: handleXOffset, bottom: handleYOffset } // bottom left
        ].forEach((pos, idx) => {
            Object.assign(this.boxes[idx].style, pos);
        });
    };

    addBox = (cursor: any) => {
        // create div element for resize handle
        const box = document.createElement('div');

        // Start with the specified styles
        Object.assign(box.style, this.options.handleStyles);
        box.style.cursor = cursor;

        // Set the width/height to use 'px'
        box.style.width = `${this.options.handleStyles.width}px`;
        box.style.height = `${this.options.handleStyles.height}px`;

        // listen for mousedown on each box
        box.addEventListener('pointerdown', this.handleMousedown, false);
        // add drag handle to document
        this.overlay.appendChild(box);
        // keep track of drag handle
        this.boxes.push(box);
    };

    handleMousedown = (evt: MouseEvent) => {
        this.handleMouseup();
        this.dragStyles = {
            bodyCursor: document.body.style.cursor,
            imageCursor: this.img.style.cursor,
            touchAction: document.body.style.touchAction
        };
        // note which box
        this.dragBox = evt.target as HTMLElement;
        // note starting mousedown position
        this.dragStartX = evt.clientX;
        // store the width before the drag
        this.preDragWidth = this.img!.width || this.img!.naturalWidth;
        // set the proper cursor everywhere
        this.setCursor(this.dragBox.style.cursor);

        // disable default behavior of touch gestures on document root, s.t. pointermove gets not interrupted
        document.body.style.touchAction = 'none';
        // listen for movement and mouseup
        document.addEventListener('pointermove', this.handleDrag, false);
        document.addEventListener('pointerup', this.handleMouseup, false);
        document.addEventListener('pointercancel', this.handleMouseup, false);
    };

    handleMouseup = () => {
        if (this.dragStyles) {
            document.body.style.touchAction = this.dragStyles.touchAction;
            document.body.style.cursor = this.dragStyles.bodyCursor;
            this.img.style.cursor = this.dragStyles.imageCursor;
            this.dragStyles = undefined;
        }
        this.dragBox = undefined;
        document.removeEventListener('pointermove', this.handleDrag);
        document.removeEventListener('pointerup', this.handleMouseup);
        document.removeEventListener('pointercancel', this.handleMouseup);
    };

    handleDrag = (evt: PointerEvent) => {
        if (!this.img) {
            // image not set yet
            return;
        }
        // update image size
        const deltaX = evt.clientX - this.dragStartX;
        const isLeftHandle = this.dragBox === this.boxes[0] || this.dragBox === this.boxes[3];
        const width = Math.max(1, Math.round(this.preDragWidth + (isLeftHandle ? -deltaX : deltaX)));
        this.img.width = width;
        this.img.style.width = `${width}px`;
        // Let height follow the natural aspect ratio, including for restored images with a fixed height.
        this.img.removeAttribute('height');
        this.img.style.height = 'auto';
        this.requestUpdate();
    };

    setCursor = (value: string) => {
        [document.body, this.img].forEach((el) => {
            if (el) {
                el.style.cursor = value;
            }
        });
    };
}
