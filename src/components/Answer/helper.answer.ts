import { DocumentType } from '@tdev-api/document';

export const getAnswerDocumentType = (type: string): DocumentType => {
    switch (type) {
        case 'text':
            return 'quill_v2';
        case 'string':
            return 'string';
        case 'state':
            return 'task_state';
        case 'progress':
            return 'progress_state';
        default:
            return type as DocumentType;
    }
};
