import type MdxDocument from '../models/MdxDocument';
import { containerDirectiveSource, leafDirectiveSource, textDirectiveSource } from './directives';
import { iconSource } from './icons';
import { imageSource } from './images';
import { quickActionSource } from './quickActions';
import type { SuggestionSource } from './types';

export type { Suggestion, SuggestionSource } from './types';

/** the first source matching the typed text offers its suggestions */
export const suggestionSources = (document: MdxDocument): SuggestionSource[] => [
    quickActionSource(document),
    imageSource(document),
    iconSource,
    containerDirectiveSource,
    leafDirectiveSource,
    textDirectiveSource
];
