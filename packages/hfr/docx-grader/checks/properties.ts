import { LineSpacing, ParagraphFormat, RunFormat, TabStop } from '../docx/formatting';

interface PropertyDescriptor<V> {
    label: string;
    format: (value: V) => string;
}

export type PropertyDescriptors<T> = { [K in keyof T]-?: PropertyDescriptor<T[K]> };

// Lengths are rounded to 0.01 cm or 0.1 pt when read; Word's own unit conversions stay within this.
const TOLERANCE = 0.05;

export const yesNo = (value: boolean | undefined) => (value ? 'ja' : 'nein');
const cm = (value: number | undefined) => `${value} cm`;
const pt = (value: number | undefined) => `${value} pt`;
export const lookup = (labels: { [value: string]: string }) => (value: string) => labels[value] ?? value;

const TAB_ALIGNMENTS: { [value: string]: string } = {
    left: 'links',
    start: 'links',
    center: 'zentriert',
    right: 'rechts',
    end: 'rechts',
    decimal: 'dezimal',
    bar: 'vertikale Linie'
};

const formatTabStops = (tabStops: TabStop[]) => {
    if (tabStops.length === 0) {
        return 'keine';
    }
    return tabStops
        .map((tab) => {
            const leader = tab.leader !== 'none' ? ` mit Füllzeichen (${tab.leader})` : '';
            return `${tab.positionCm} cm ${TAB_ALIGNMENTS[tab.alignment] ?? tab.alignment}${leader}`;
        })
        .join(', ');
};

const formatLineSpacing = (lineSpacing: LineSpacing) => {
    if (lineSpacing.rule === 'multiple') {
        return `${lineSpacing.value}-fach`;
    }
    return `${lineSpacing.rule === 'exact' ? 'genau' : 'mindestens'} ${lineSpacing.valuePt} pt`;
};

export const PARAGRAPH_PROPERTIES: PropertyDescriptors<ParagraphFormat> = {
    alignment: {
        label: 'Ausrichtung',
        format: lookup({
            left: 'linksbündig',
            center: 'zentriert',
            right: 'rechtsbündig',
            justify: 'Blocksatz'
        })
    },
    indentLeftCm: { label: 'Einzug links', format: cm },
    indentRightCm: { label: 'Einzug rechts', format: cm },
    indentFirstLineCm: {
        label: 'Sondereinzug',
        format: (value) => (value < 0 ? `hängend ${-value} cm` : `erste Zeile ${value} cm`)
    },
    spacingBeforePt: { label: 'Abstand vor', format: pt },
    spacingAfterPt: { label: 'Abstand nach', format: pt },
    lineSpacing: { label: 'Zeilenabstand', format: formatLineSpacing },
    contextualSpacing: { label: 'Kein Abstand zwischen Absätzen gleicher Formatierung', format: yesNo },
    keepWithNext: { label: 'Nicht vom nächsten Absatz trennen', format: yesNo },
    keepLinesTogether: { label: 'Diese Zeilen nicht trennen', format: yesNo },
    pageBreakBefore: { label: 'Seitenumbruch oberhalb', format: yesNo },
    tabStops: { label: 'Tabstopps', format: formatTabStops }
};

export const RUN_PROPERTIES: PropertyDescriptors<RunFormat> = {
    font: { label: 'Schriftart', format: (value) => value },
    sizePt: { label: 'Schriftgrösse', format: pt },
    bold: { label: 'Fett', format: yesNo },
    italic: { label: 'Kursiv', format: yesNo },
    underline: {
        label: 'Unterstrichen',
        format: lookup({ none: 'nein', single: 'einfach', double: 'doppelt', words: 'nur Wörter' })
    },
    strike: { label: 'Durchgestrichen', format: yesNo },
    color: { label: 'Schriftfarbe', format: (value) => (value === 'auto' ? 'automatisch' : `#${value}`) },
    highlight: { label: 'Hervorhebung', format: lookup({ none: 'keine' }) },
    allCaps: { label: 'Grossbuchstaben', format: yesNo },
    smallCaps: { label: 'Kapitälchen', format: yesNo },
    verticalAlign: {
        label: 'Position',
        format: lookup({ baseline: 'normal', superscript: 'hochgestellt', subscript: 'tiefgestellt' })
    }
};

/** The properties of `values` that differ from `base`. */
export const differences = <T extends object>(
    values: T,
    base: T,
    descriptors: PropertyDescriptors<T>
): Partial<T> => {
    const keys = Object.keys(descriptors) as (keyof T)[];
    return Object.fromEntries(
        keys.filter((key) => !isSameValue(values[key], base[key])).map((key) => [key, values[key]])
    ) as Partial<T>;
};

/** One message per expected property that `actual` does not have. */
export const mismatches = <T extends object>(
    expected: Partial<T>,
    actual: T,
    descriptors: PropertyDescriptors<T>
): string[] => {
    const keys = Object.keys(expected) as (keyof T)[];
    return keys
        .filter((key) => descriptors[key] && !isSameValue(actual[key], expected[key]))
        .map((key) => {
            const { label, format } = descriptors[key];
            return `${label}: ${format(actual[key])} statt ${format(expected[key] as T[keyof T])}`;
        });
};

export const describeProperties = <T extends object>(
    values: Partial<T>,
    descriptors: PropertyDescriptors<T>
): string => {
    const keys = Object.keys(values) as (keyof T)[];
    return keys
        .filter((key) => descriptors[key])
        .map((key) => `${descriptors[key].label}: ${descriptors[key].format(values[key] as T[keyof T])}`)
        .join(', ');
};

export const isSameValue = (a: unknown, b: unknown): boolean => {
    if (typeof a === 'number' && typeof b === 'number') {
        return Math.abs(a - b) <= TOLERANCE;
    }
    if (typeof a === 'string' && typeof b === 'string') {
        return a.toLowerCase() === b.toLowerCase();
    }
    if (Array.isArray(a) && Array.isArray(b)) {
        return a.length === b.length && a.every((item, index) => isSameValue(item, b[index]));
    }
    if (a && b && typeof a === 'object' && typeof b === 'object') {
        const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
        return [...keys].every((key) => isSameValue(a[key as keyof typeof a], b[key as keyof typeof b]));
    }
    return a === b;
};
