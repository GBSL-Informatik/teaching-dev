import PageReadCheck from './model';
export interface PageReadCheckData {
    readTime: number;
    read: boolean;
}

declare module '@tdev-api/document' {
    export interface TypeDataMapping {
        ['page_read_check']: PageReadCheckData;
    }
    export interface TypeModelMapping {
        ['page_read_check']: PageReadCheck;
    }
}
