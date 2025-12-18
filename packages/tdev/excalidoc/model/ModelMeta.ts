import { TypeDataMapping, Access } from '@tdev-api/document';
import { TypeMeta } from '@tdev-models/DocumentRoot';
import type { ExcalidrawElement } from '@excalidraw/excalidraw/element/types';
import type { BinaryFiles } from '@excalidraw/excalidraw/types';

export interface MetaInit {
    readonly?: boolean;
    defaultFiles?: BinaryFiles;
    defaultElements?: readonly ExcalidrawElement[];
    defaultImage?: string;
}

export class ModelMeta extends TypeMeta<'excalidoc'> {
    readonly type = 'excalidoc';
    readonly defaultElements: readonly ExcalidrawElement[];
    readonly defaultFiles: BinaryFiles;
    readonly defaultImage: string;

    constructor(props: Partial<MetaInit>) {
        super('excalidoc', props.readonly ? Access.RO_User : undefined);
        this.defaultElements = props.defaultElements || [];
        this.defaultFiles = props.defaultFiles || {};
        this.defaultImage = props.defaultImage || '';
    }

    get defaultData(): TypeDataMapping['excalidoc'] {
        return {
            elements: this.defaultElements,
            files: this.defaultFiles,
            image: this.defaultImage
        };
    }
}
