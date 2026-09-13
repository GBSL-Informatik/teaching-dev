import { ReactContextError } from '@docusaurus/theme-common';
import { DocumentType, TypeModelMapping } from '@tdev-api/document';
import { DocContext } from '@tdev-components/documents/DocumentContext';
import { useContext } from 'react';

export function useDocument<T extends DocumentType>(): TypeModelMapping[T] {
    const context = useContext(DocContext);
    if (context === null) {
        throw new ReactContextError(
            'DocumentContextProvider',
            'The Component must be a child of the DocumentContextProvider component'
        );
    }
    return context as TypeModelMapping[T];
}
