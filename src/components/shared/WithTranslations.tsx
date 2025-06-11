import React from 'react';
import { observer } from 'mobx-react-lite';

export type Translation =
    | Record<string, React.ReactNode | ((val: string) => React.ReactNode)>
    | ((val: string) => React.ReactNode);

export interface Props {
    children: React.ReactNode;
    translations?: Translation;
}

export const TranslationsContext = React.createContext<Translation | null>(null);

const WithTranslations = observer((props: Props) => {
    return (
        <TranslationsContext.Provider value={props.translations || null}>
            {props.children}
        </TranslationsContext.Provider>
    );
});

export default WithTranslations;
