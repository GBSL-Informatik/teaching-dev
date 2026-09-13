import { mdiFormatAlignCenter, mdiFormatAlignLeft, mdiFormatAlignRight, mdiTrashCan } from '@mdi/js';
import { Parchment } from 'quill';
import styles from '../styles.module.scss';
import { BaseModule } from './BaseModule';
import { deleteSelectedImage } from './helper';

// let Parchment: any = {};

const getSvgIcon = (icon: string, attrs?: { className?: string; size?: string | number }) => {
    const size = Number(attrs?.size) ? `${attrs!.size || 1}rem` : attrs?.size || '1rem';
    return `<svg viewBox="0 0 24 24" role="presentation" class="${attrs?.className || ''}" style="width: ${size}; height: ${size};"><path d="${icon}" style="fill: currentcolor;"></path></svg>`;
};

export default class Toolbar extends BaseModule {
    toolbar?: HTMLDivElement;
    alignments: {
        name: string;
        icon: string;
        apply: () => void;
        isApplied: () => boolean;
    }[] = [];
    static FloatStyle: Parchment.StyleAttributor;
    static MarginStyle: Parchment.StyleAttributor;
    static DisplayStyle: Parchment.StyleAttributor;

    onCreate = () => {
        // Initilize styles
        Toolbar.FloatStyle = new Parchment.StyleAttributor('float', 'float');
        Toolbar.MarginStyle = new Parchment.StyleAttributor('margin', 'margin');
        Toolbar.DisplayStyle = new Parchment.StyleAttributor('display', 'display');
        // DisplayStyle = new Parchment.StyleAttributor('display', 'display');

        // Setup Toolbar
        this.toolbar = document.createElement('div');
        Object.assign(this.toolbar.style, this.options.toolbarStyles);
        this.overlay.appendChild(this.toolbar);

        // Setup Buttons
        this._defineAlignments();
        this._addToolbarButtons();
    };

    // The toolbar and its children will be destroyed when the overlay is removed
    onDestroy = () => {};

    // Nothing to update on drag because we are are positioned relative to the overlay
    onUpdate = () => {};

    _defineAlignments = () => {
        this.alignments = [
            {
                name: 'left',
                icon: mdiFormatAlignLeft,
                apply: () => {
                    Toolbar.DisplayStyle.add(this.img, 'inline');
                    Toolbar.FloatStyle.add(this.img, 'left');
                    Toolbar.MarginStyle.add(this.img, '0 1em 1em 0');
                },
                isApplied: () => Toolbar.FloatStyle.value(this.img) == 'left'
            },
            {
                name: 'center',
                icon: mdiFormatAlignCenter,
                apply: () => {
                    Toolbar.DisplayStyle.add(this.img, 'block');
                    Toolbar.FloatStyle.remove(this.img);
                    Toolbar.MarginStyle.add(this.img, 'auto');
                },
                isApplied: () => Toolbar.MarginStyle.value(this.img) == 'auto'
            },
            {
                name: 'right',
                icon: mdiFormatAlignRight,
                apply: () => {
                    Toolbar.DisplayStyle.add(this.img, 'inline');
                    Toolbar.FloatStyle.add(this.img, 'right');
                    Toolbar.MarginStyle.add(this.img, '0 0 1em 1em');
                },
                isApplied: () => Toolbar.FloatStyle.value(this.img) == 'right'
            },
            {
                name: 'delete',
                icon: mdiTrashCan,
                apply: () => {
                    deleteSelectedImage(this.quill, this.img.src);
                },
                isApplied: () => Toolbar.FloatStyle.value(this.img) == 'delete'
            }
        ];
    };

    _addToolbarButtons = () => {
        const buttons: HTMLSpanElement[] = [];
        if (this.toolbar) {
            this.toolbar.classList.add(styles.imgToolbar);
            this.alignments.forEach((alignment, idx) => {
                const button = document.createElement('span');
                buttons.push(button);
                button.innerHTML = getSvgIcon(alignment.icon, { size: '20px' });
                button.addEventListener('click', () => {
                    // deselect all buttons
                    buttons.forEach((button) => button.classList.remove(styles.active));
                    if (alignment.isApplied() && this.img) {
                        // If applied, unapply
                        Toolbar.FloatStyle.remove(this.img);
                        Toolbar.MarginStyle.remove(this.img);
                        Toolbar.DisplayStyle.remove(this.img);
                    } else {
                        alignment.apply();
                        button.classList.add(styles.active);
                    }
                    // image may change position; redraw drag handles
                    this.requestUpdate();
                });
                Object.assign(button.style, this.options.toolbarButtonStyles);
                button.classList.add(styles.imgToolbarButton, styles[alignment.name]);
                if (alignment.isApplied()) {
                    button.classList.add(styles.active);
                }
                this.toolbar!.appendChild(button);
            });
        }
    };
}
