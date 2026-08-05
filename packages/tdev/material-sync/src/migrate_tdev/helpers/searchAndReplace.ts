import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

type replaceFn = (match: string, args: any[]) => string;
interface ReplaceWith {
    pattern: string | RegExp;
    replacement: string | replaceFn;
}

const replace = (content: string, replaceWith: ReplaceWith): string => {
    const { pattern, replacement } = replaceWith;
    const regex = typeof pattern === 'string' ? new RegExp(pattern, 'g') : pattern;
    if (typeof replacement === 'function') {
        return content.replace(regex, (matchedWord, ...args) => {
            return replacement(matchedWord, args);
        });
    } else {
        return content.replace(regex, replacement);
    }
};
/**
 *
 * @param root project root path
 * @param filePath path to file, relative to root
 * @param search string or regex (should have a global and multiline `/gm` flag in most cases) to search for
 *
 * @param replace string or function to replace the matched string
 *                  function receives the matched string and an array of additional arguments (like capture groups)
 *                          'hello and eldorado'.replace(/e(..)o/g, (match, ...args) => { console.log(match, args); return 'X'; })
 *                          // logs: 'ello' ['ll', 1, 'hello and eldorado']
 *                          // logs: 'eldo' ['ld', 10, 'hello and eldorado']
 *                   for a named regex:
 *                      'hello and eldorado'.replace(/e(?<name>..)o/g, (match, ...args) => { console.log(match, args); return 'X'; })
 *                    // logs: 'ello' ['ll', 1, 'hello and eldorado', { name: 'll' }]
 *                    // logs: 'eldo' ['ld', 10, 'hello and eldorado', { name: 'ld' }]
 * @returns void
 */
export const searchAndReplace = async (
    filePath: string,
    replacers: { pattern: string | RegExp; replacement: string | replaceFn }[]
): Promise<void> => {
    const fileContent = await readFile(filePath, 'utf-8');
    const newContent = replacers.reduce((content, replaceWith) => {
        return replace(content, replaceWith);
    }, fileContent);

    await writeFile(filePath, newContent, 'utf-8');
};

export const applySearchAndReplace = async (
    files: string[],
    replacers: { pattern: string | RegExp; replacement: string | replaceFn }[]
): Promise<void> => {
    const promises = files.map((file) => searchAndReplace(file, replacers));
    await Promise.all(promises);
};
