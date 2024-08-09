export interface ToolbarOptions {
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    h1?: boolean;
    h2?: boolean;
    h3?: boolean;
    color?: boolean;
    background?: boolean;
    ul?: boolean;
    ol?: boolean;
    // formula?: boolean;
    code?: boolean;
    image?: boolean;
}

/**
 * no typings available from react-quill bindings.
 * This is a best guess based on the usecase and examples in the docs.
 * Edit this if the editor needs more/different toolbar options.
 */
export type ToolbarModule = (
    | string[]
    | (number | boolean)[]
    | ToolbarModule
    | {
          header: (number | boolean)[];
      }[]
    | (
          | {
                color: never[];
                background?: undefined;
            }
          | {
                background: never[];
                color?: undefined;
            }
      )[]
    | {
          list: string;
      }[]
)[];

export const TOOLBAR_BASE: ToolbarModule = [['bold', 'italic', 'underline', 'code-block']];

export const TOOLBAR: ToolbarModule = [
    ...TOOLBAR_BASE,
    [{ header: [1, 2, 3, false] }],
    [{ color: [] }, { background: [] }], // dropdown with defaults from theme
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['image']
];

export const getToolbar = (options: ToolbarOptions): ToolbarModule => {
    const toolbar = [];
    if (options.bold || options.italic || options.underline) {
        const marker = [];
        if (options.bold) {
            marker.push('bold');
        }
        if (options.italic) {
            marker.push('italic');
        }
        if (options.underline) {
            marker.push('underline');
        }
        toolbar.push(marker);
    }
    if (options.h1 || options.h2 || options.h3) {
        const h = [];
        if (options.h1) {
            h.push(1);
        }
        if (options.h2) {
            h.push(2);
        }
        if (options.h3) {
            h.push(3);
        }
        h.push(false);
        toolbar.push(h);
    }
    if (options.color || options.background) {
        const c = [];
        if (options.color) {
            c.push({ color: [] });
        }
        if (options.background) {
            c.push({ background: [] });
        }
        toolbar.push(c);
    }
    if (options.ul || options.ol) {
        const l = [];
        if (options.ol) {
            l.push({ list: 'ordered' });
        }
        if (options.ul) {
            l.push({ list: 'bullet' });
        }
        toolbar.push(l);
    }
    if (options.image) {
        // || options.formula
        const visuals = [];
        // if (options.formula) {
        //     visuals.push('formula');
        // }
        if (options.image) {
            visuals.push('image');
        }
        toolbar.push(visuals);
    }
    if (options.code) {
        toolbar.push(['code-block']);
    }
    return toolbar;
};
