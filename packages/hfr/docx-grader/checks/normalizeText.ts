import { TextRun } from '../docx/DocModel';
import { INITIAL_RUN_FORMAT, RunFormat } from '../docx/formatting';

/** Characters a group treats as equal, e.g. `['-', '–', '—']`; the first one represents the group. */
export type EquivalentCharacters = string[][];

export const DEFAULT_EQUIVALENT_CHARACTERS: EquivalentCharacters = [
    ['-', '–', '—', '‑'],
    ['"', '“', '”', '„', '«', '»'],
    ["'", '‘', '’', '‚', '‹', '›']
];

// Soft hyphens and zero width characters are invisible.
const INVISIBLE = /[­​‌‍﻿]/;

export interface NormalizedChar {
    char: string;
    format: RunFormat;
}

export type Normalizer = (text: string) => string;

/**
 * Normalizes the text of runs, keeping the run format of every character, so a text segment can be
 * located in the normalized text and its formatting read. Any whitespace sequence becomes one space.
 */
export const normalizeRuns = (runs: TextRun[], equivalents: EquivalentCharacters): NormalizedChar[] => {
    const representatives = new Map<string, string>();
    equivalents.forEach((group) => group.forEach((char) => representatives.set(char, group[0])));

    const chars: NormalizedChar[] = [];
    for (const run of runs) {
        for (const char of run.text) {
            if (INVISIBLE.test(char)) {
                continue;
            }
            const normalized = /\s/.test(char) ? ' ' : (representatives.get(char) ?? char);
            const isLeadingOrRepeatedSpace = normalized === ' ' && (chars.at(-1)?.char ?? ' ') === ' ';
            if (!isLeadingOrRepeatedSpace) {
                chars.push({ char: normalized, format: run.format });
            }
        }
    }
    while (chars.at(-1)?.char === ' ') {
        chars.pop();
    }
    return chars;
};

export const createNormalizer = (equivalents: EquivalentCharacters): Normalizer => {
    return (text) => {
        const chars = normalizeRuns([{ text, format: INITIAL_RUN_FORMAT }], equivalents);
        return chars.map(({ char }) => char).join('');
    };
};
