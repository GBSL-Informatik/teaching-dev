import { directiveToMarkdown } from 'mdast-util-directive';
import type { Options as ToMarkdownOptions, Unsafe } from 'mdast-util-to-markdown';
import { directive } from 'micromark-extension-directive';
import { classifyCharacter } from 'micromark-util-classify-character';
import type { Code, Construct, Extension, Previous } from 'micromark-util-types';

/**
 * Text directives start at a word boundary only, so `Schüler:innen` stays text.
 * remark-directive starts them after any character but `:`, Docusaurus then turns
 * unknown ones like `:innen` back into text.
 *
 * A word boundary is the start of the text, whitespace or punctuation, as for the
 * emphasis in CommonMark: `(:mdi[x])` and `**:mdi[x]**` remain directives.
 */
const COLON = 58;

const isWordBoundary = (code: Code) => classifyCharacter(code) !== undefined;

/** the directive syntax for `micromark`, with text directives at word boundaries */
export const directiveSyntax = (): Extension => {
    const extension = directive();
    const textDirective = extension.text![COLON] as Construct;
    const previous: Previous = function (code) {
        return isWordBoundary(code) && textDirective.previous!.call(this, code);
    };
    return { ...extension, text: { [COLON]: { ...textDirective, previous } } };
};

/** the escaped `:`, for `mdast-util-to-markdown`: `a :b` is escaped, `a:b` is not */
export const directiveToMarkdownAtWordBoundary = (): ToMarkdownOptions => {
    const extension = directiveToMarkdown();
    const unsafe = extension.unsafe!.map((pattern) => {
        if (!isTextDirectiveStart(pattern)) {
            return pattern;
        }
        return { ...pattern, before: '^|(?!:)[\\s\\p{P}\\p{S}]' };
    });
    return { ...extension, unsafe };
};

const isTextDirectiveStart = (pattern: Unsafe) => {
    return pattern.character === ':' && pattern.before === '[^:]';
};
