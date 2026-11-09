/** lower case and without diacritics, so that `uber` finds `Über` */
const normalize = (text: string) => {
    return text
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .toLowerCase();
};

const isSubsequence = (query: string, term: string) => {
    let index = 0;
    for (const char of term) {
        if (char === query[index]) {
            index++;
        }
    }
    return index === query.length;
};

const termScore = (query: string, term: string) => {
    if (term.startsWith(query)) {
        return 4;
    }
    if (term.split(/[^\p{L}\p{N}]+/u).some((word) => word.startsWith(query))) {
        return 3;
    }
    if (term.includes(query)) {
        return 2;
    }
    if (isSubsequence(query, term)) {
        return 1;
    }
    return 0;
};

/**
 * How well the query matches the best of the terms: 0 if none matches, higher is better.
 * An empty query matches every term equally.
 */
export const fuzzyScore = (query: string, terms: string[]): number => {
    const normalizedQuery = normalize(query);
    const scores = terms.map((term) => termScore(normalizedQuery, normalize(term)));
    return Math.max(0, ...scores);
};

/**
 * The items matching the query, the best match first. Items matching equally well keep their order.
 */
export const fuzzyFilter = <T>(items: T[], query: string, termsOf: (item: T) => string[]): T[] => {
    return items
        .map((item) => ({ item, score: fuzzyScore(query, termsOf(item)) }))
        .filter(({ score }) => score > 0)
        .sort((a, b) => b.score - a.score)
        .map(({ item }) => item);
};
