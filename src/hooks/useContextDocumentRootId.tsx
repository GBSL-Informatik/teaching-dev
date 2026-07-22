import React from 'react';
import { ReactContextError } from '@docusaurus/theme-common';
import { observer } from 'mobx-react-lite';

export const DocRootIdContext = React.createContext<string | null>(null);
interface Props {
    id: string;
    children: React.ReactNode;
}

export const DocumentRootIdContext = observer((props: Props) => {
    return <DocRootIdContext.Provider value={props.id}>{props.children}</DocRootIdContext.Provider>;
});

export const useDocumentRootId = (defaultId?: string): string => {
    const context = React.useContext(DocRootIdContext);
    if (context === null) {
        if (defaultId) {
            return defaultId;
        }
        throw new ReactContextError(
            'DocumentContextProvider',
            'The Component must be a child of the DocumentContextProvider component'
        );
    }
    return context;
};
