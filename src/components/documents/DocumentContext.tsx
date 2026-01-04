import React from 'react';
import { DocumentType, DocumentModelType, TypeModelMapping } from '@tdev-api/document';
import { observer } from 'mobx-react-lite';

export const DocContext = React.createContext<DocumentModelType | undefined>(undefined);
interface Props<T extends DocumentType> {
    document: TypeModelMapping[T];
    children: React.ReactNode;
}

const DocumentContext = observer(<T extends DocumentType>(props: Props<T>) => {
    return <DocContext.Provider value={props.document}>{props.children}</DocContext.Provider>;
});

export default DocumentContext;
