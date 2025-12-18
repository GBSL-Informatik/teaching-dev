import NetpbmGraphic from './model';

export interface NetpbmGraphicData {
    imageData: string;
}

declare module '@tdev-api/document' {
    export interface TypeDataMapping {
        ['netpbm_graphic']: NetpbmGraphicData;
    }
    export interface TypeModelMapping {
        ['netpbm_graphic']: NetpbmGraphic;
    }
}
