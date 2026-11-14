import { LanguageDescription } from '@codemirror/language';
import { languages } from '@codemirror/language-data';
import type File from '../models/File';

/**
 * The CodeMirror language support for the file, empty when the language is unknown.
 */
export const loadLanguage = async (file: File) => {
    // mdx is not known to `@codemirror/language-data`
    const fallback = file.isMarkdown ? LanguageDescription.matchLanguageName(languages, 'markdown') : null;
    const description = LanguageDescription.matchFilename(languages, file.name) ?? fallback;
    return description ? description.load() : [];
};
