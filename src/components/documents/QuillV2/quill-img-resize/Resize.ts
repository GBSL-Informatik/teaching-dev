import styles from '../styles.module.scss';
import { BaseModule } from './BaseModule';
export default class Resize extends BaseModule {
    boxes: HTMLDivElement[] = [];
    dragBox?: HTMLDivElement;
    dragStartX: number = 0;
    preDragWidth: number = 0;
    private pointerId?: number;
    private dragStyles?: { bodyCursor: string; imageCursor: string };
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
        this.stopDragging();
        this.boxes.forEach((box) => box.removeEventListener('pointerdown', this.handlePointerDown));
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

    addBox = (cursor: string) => {
        // create div element for resize handle
        const box = document.createElement('div');

        // Start with the specified styles
        Object.assign(box.style, this.options.handleStyles);
        box.style.cursor = cursor;
        box.classList.add(styles.imageResizeHandle);

        box.addEventListener('pointerdown', this.handlePointerDown);
        // add drag handle to document
        this.overlay.appendChild(box);
        // keep track of drag handle
        this.boxes.push(box);
    };

    handlePointerDown = (evt: PointerEvent) => {
        if (evt.button !== 0 || !evt.isPrimary || this.pointerId !== undefined) {
            return;
        }
        evt.preventDefault();
        this.dragStyles = {
            bodyCursor: document.body.style.cursor,
            imageCursor: this.img.style.cursor
        };
        this.dragBox = evt.currentTarget as HTMLDivElement;
        this.pointerId = evt.pointerId;
        this.dragStartX = evt.clientX;
        this.preDragWidth = this.img.width || this.img.naturalWidth;
        this.setCursor(this.dragBox.style.cursor);

        // Keep receiving this pointer as the image and handle move underneath the finger.
        this.dragBox.setPointerCapture(evt.pointerId);
        this.dragBox.addEventListener('lostpointercapture', this.handlePointerEnd);
        document.addEventListener('pointermove', this.handleDrag);
        document.addEventListener('pointerup', this.handlePointerEnd);
        document.addEventListener('pointercancel', this.handlePointerEnd);
        window.addEventListener('blur', this.stopDragging);
    };

    handlePointerEnd = (evt: PointerEvent) => {
        if (evt.pointerId === this.pointerId) {
            this.stopDragging();
        }
    };

    stopDragging = () => {
        const box = this.dragBox;
        const pointerId = this.pointerId;
        this.dragBox = undefined;
        this.pointerId = undefined;
        document.removeEventListener('pointermove', this.handleDrag);
        document.removeEventListener('pointerup', this.handlePointerEnd);
        document.removeEventListener('pointercancel', this.handlePointerEnd);
        window.removeEventListener('blur', this.stopDragging);
        box?.removeEventListener('lostpointercapture', this.handlePointerEnd);
        if (pointerId !== undefined && box?.hasPointerCapture(pointerId)) {
            box.releasePointerCapture(pointerId);
        }
        if (this.dragStyles) {
            document.body.style.cursor = this.dragStyles.bodyCursor;
            this.img.style.cursor = this.dragStyles.imageCursor;
            this.dragStyles = undefined;
        }
    };

    handleDrag = (evt: PointerEvent) => {
        if (evt.pointerId !== this.pointerId || !this.dragBox) {
            return;
        }
        evt.preventDefault();
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
