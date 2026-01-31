import { DocumentType } from '@tdev-api/document';
import iDocument from './iDocument';

export interface iTaskableDocument<T extends DocumentType = DocumentType> extends iDocument<T> {
    isDone: boolean;
}
