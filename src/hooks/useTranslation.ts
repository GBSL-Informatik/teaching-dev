import React, { useContext } from 'react';
import { TranslationsContext } from '@tdev-components/shared/WithTranslations';

export function useTranslation(key: string): React.ReactNode {
    const context = useContext(TranslationsContext);
    if (context === null) {
        return key;
    }
    if (typeof context === 'function') {
        return context(key);
    }
    if (key in context) {
        if (typeof context[key] === 'function') {
            return context[key](key);
        }
        return context[key];
    }
    return key;
}
