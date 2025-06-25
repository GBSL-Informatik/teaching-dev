import React, { useContext } from 'react';
import { TranslationsContext } from '@tdev-components/shared/WithTranslations';

export function useTranslation(name?: string): React.ReactNode {
    const context = useContext(TranslationsContext);
    if (name === null || name === undefined) {
        return name;
    }
    if (context === null) {
        return name;
    }
    if (typeof context === 'function') {
        return context(name);
    }
    if (name in context) {
        if (typeof context[name] === 'function') {
            return context[name](name);
        }
        return context[name];
    }
    return name;
}
