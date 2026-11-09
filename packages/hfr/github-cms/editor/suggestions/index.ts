import { containerDirectiveSource, leafDirectiveSource, textDirectiveSource } from './directives';
import { iconSource } from './icons';
import { quickActionSource } from './quickActions';
import type { SuggestionSource } from './types';

export type { Suggestion, SuggestionSource } from './types';

/** the first source matching the typed text offers its suggestions */
export const SUGGESTION_SOURCES: SuggestionSource[] = [
    quickActionSource,
    iconSource,
    containerDirectiveSource,
    leafDirectiveSource,
    textDirectiveSource
];
