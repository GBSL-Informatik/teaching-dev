import { DocumentModelType, DocumentType, TypeModelMapping } from '@tdev-api/document';
import { observer } from 'mobx-react-lite';
import React from 'react';

export const DocContext = React.createContext<DocumentModelType | undefined>(undefined);
interface Props<T extends DocumentType> {
    document: TypeModelMapping[T];
    children: React.ReactNode;
}

const DocumentContext = observer(<T extends DocumentType>(props: Props<T>) => {
    return <DocContext.Provider value={props.document}>{props.children}</DocContext.Provider>;
});

export default DocumentContext;
