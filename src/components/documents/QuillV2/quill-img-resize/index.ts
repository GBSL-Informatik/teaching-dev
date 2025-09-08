/**
 * Updated quill-resize-module by @mudoo for quill v2.
 *  - handle touch inputs
 *  - use typescript
 *  - only allow resizing with natural width and height
 * Credits to @mudoo
 * @see https://github.com/mudoo/quill-resize-module
 */

import { defaultsDeep } from 'es-toolkit/compat';
import DefaultOptions from './DefaultOptions';
import Toolbar from './Toolbar';
import Resize from './Resize';
import Size from './Size';
import React from 'react';
import type Quill from 'quill';
import { BaseModule } from './BaseModule';
import { deleteSelectedImage } from './helper';

/**
 * Custom module for quilljs to allow user to resize <img> elements
 * (Works on Chrome, Edge, Safari and replaces Firefox's native resize behavior)
 * @see https://quilljs.com/blog/building-a-custom-module/
 */
class ImageResize {
    quill: Quill;
    options: any;
    modules: BaseModule[] = [];
    img: HTMLImageElement | undefined;
    overlay?: HTMLDivElement;
    constructor(quill: any, options: any = {}) {
        // save the quill reference and options
        this.quill = quill;

        // Apply options to default options
        this.options = defaultsDeep({}, options, DefaultOptions);

        // disable native image resizing on firefox
        document.execCommand('enableObjectResizing', false, 'false');

        // respond to clicks inside the editor
        this.quill.root.addEventListener('click', this.handleClick as any, false);
        // TODO: needed?
        // this.quill.root.parentNode!.style.position = this.quill.root.parentNode!.style.position || 'relative';
    }

    initializeModules = () => {
        this.removeModules();

        this.modules = [new Toolbar(this)];
        this.modules.push(new Size(this));
        this.modules.push(new Resize(this));

        this.modules.forEach((module) => {
            module.onCreate();
        });

        this.onUpdate();
    };

    onUpdate = () => {
        this.repositionElements();
        this.modules.forEach((module) => {
            module.onUpdate();
        });
    };

    removeModules = () => {
        this.modules.forEach((module) => {
            module.onDestroy();
        });
        this.modules = [];
    };

    handleClick = (evt: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        if (
            evt.target &&
            (evt.target as HTMLElement).tagName &&
            (evt.target as HTMLElement).tagName.toUpperCase() === 'IMG'
        ) {
            if (this.img === evt.target) {
                // we are already focused on this image
                return;
            }
            if (this.img) {
                // we were just focused on another image
                this.hide();
            }
            // clicked on an image inside the editor
            this.show(evt.target as HTMLImageElement);
        } else if (this.img) {
            // clicked on a non image
            this.hide();
        }
    };

    show = (img: HTMLImageElement) => {
        // keep track of this img element
        this.img = img;
        this.img.setAttribute('data-selected', 'true');

        this.showOverlay();

        this.initializeModules();
    };

    showOverlay = () => {
        if (this.overlay) {
            this.hideOverlay();
        }

        this.quill.setSelection(null);

        // prevent spurious text selection
        this.setUserSelect('none');

        // listen for the image being deleted or moved
        document.addEventListener('keyup', this.checkImage, true);
        this.quill.root.addEventListener('input', this.checkImage as any, true);

        // Create and add the overlay
        this.overlay = document.createElement('div');
        Object.assign(this.overlay.style, this.options.overlayStyles);

        this.quill.root.parentNode?.appendChild(this.overlay);

        this.repositionElements();
    };

    hideOverlay = () => {
        if (!this.overlay) {
            return;
        }

        // Remove the overlay
        this.quill.root.parentNode?.removeChild(this.overlay);
        this.overlay = undefined;

        // stop listening for image deletion or movement
        document.removeEventListener('keyup', this.checkImage);
        this.quill.root.removeEventListener('input', this.checkImage as any);

        // reset user-select
        this.setUserSelect('');
    };

    repositionElements = () => {
        if (!this.overlay || !this.img) {
            return;
        }

        // position the overlay over the image
        const parent = this.quill.root.parentNode as HTMLElement | null;
        if (!parent) {
            return;
        }
        const imgRect = this.img.getBoundingClientRect();
        const containerRect = parent.getBoundingClientRect();

        Object.assign(this.overlay.style, {
            left: `${imgRect.left - containerRect.left - 1 + parent.scrollLeft}px`,
            top: `${imgRect.top - containerRect.top + parent.scrollTop}px`,
            width: `${imgRect.width}px`,
            height: `${imgRect.height}px`
        });
    };

    hide = () => {
        if (this.img) {
            this.img.removeAttribute('data-selected');
        }
        this.hideOverlay();
        this.removeModules();
        this.img = undefined;
    };

    setUserSelect = (value: string) => {
        ['userSelect', 'mozUserSelect', 'webkitUserSelect'].forEach((prop) => {
            // set on contenteditable element and <html>
            this.quill.root.style[prop as any] = value;
            document.documentElement.style[prop as any] = value;
        });
    };

    checkImage = (evt: KeyboardEvent) => {
        if (this.img) {
            if (evt.key === 'Delete' || evt.key === 'Backspace') {
                deleteSelectedImage(this.quill, this.img.src);
            }
            this.hide();
        }
    };
}

export default ImageResize;
