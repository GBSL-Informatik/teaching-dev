import PageReadCheck from './model';
export interface PageReadCheckData {
    readTime: number;
    read: boolean;
}

declare module '@tdev-api/document' {
    export interface TaskableDocumentMapping {
        ['page_read_check']: PageReadCheckData;
    }
    export interface TaskableTypeModelMapping {
        ['page_read_check']: PageReadCheck;
    }
}
