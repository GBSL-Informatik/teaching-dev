import {
    applyParagraphLayers,
    applyRunLayers,
    INITIAL_PARAGRAPH_FORMAT,
    INITIAL_RUN_FORMAT,
    ParagraphFormat,
    ParagraphFormatLayer,
    parseParagraphFormat,
    parseRunFormat,
    RunFormat,
    RunFormatLayer,
    ThemeFonts
} from './formatting';
import { attr, childElement, childElements, childVal, descendants, XmlElement } from './xml';

export interface Style {
    id: string;
    /** Built-in styles use their English name (e.g. `heading 1`), whatever the language of Word. */
    name: string;
    type: string;
    basedOn?: string;
    paragraph: ParagraphFormatLayer;
    run: RunFormatLayer;
    numbering?: { numId?: string; level?: number };
}

export interface NumberingLevel {
    /** e.g. `decimal`, `bullet`, `lowerLetter` */
    format: string;
    /** e.g. `%1.%2.` */
    text: string;
    paragraph: ParagraphFormatLayer;
}

export interface StyleSheet {
    styles: Map<string, Style>;
    defaultParagraphStyleId?: string;
    paragraphDefaults: ParagraphFormatLayer;
    runDefaults: RunFormatLayer;
    themeFonts: ThemeFonts;
    /** Numbering levels by `numId`, then by level. */
    numbering: Map<string, NumberingLevel[]>;
}

export interface ResolvedParagraph {
    style: Style | undefined;
    format: ParagraphFormat;
    numbering?: NumberingLevel & { level: number };
}

const FALLBACK_THEME_FONTS: ThemeFonts = { major: 'Calibri Light', minor: 'Calibri' };

export const parseStyleSheet = (
    styles: XmlElement | undefined,
    numbering: XmlElement | undefined,
    themeFonts: ThemeFonts
): StyleSheet => {
    const docDefaults = childElement(styles, 'w:docDefaults');
    const parsedStyles = (styles ? childElements(styles, 'w:style') : []).map((style) =>
        parseStyle(style, themeFonts)
    );
    const defaultParagraphStyle = (styles ? childElements(styles, 'w:style') : []).find(
        (style) => attr(style, 'w:type') === 'paragraph' && attr(style, 'w:default') === '1'
    );

    return {
        styles: new Map(parsedStyles.map((style) => [style.id, style])),
        defaultParagraphStyleId: attr(defaultParagraphStyle, 'w:styleId'),
        paragraphDefaults: parseParagraphFormat(
            childElement(childElement(docDefaults, 'w:pPrDefault'), 'w:pPr')
        ),
        runDefaults: parseRunFormat(
            childElement(childElement(docDefaults, 'w:rPrDefault'), 'w:rPr'),
            themeFonts
        ),
        themeFonts,
        numbering: parseNumbering(numbering)
    };
};

export const findStyleByName = (sheet: StyleSheet, name: string): Style | undefined => {
    return [...sheet.styles.values()].find((style) => style.name === name);
};

export const paragraphStyle = (sheet: StyleSheet, styleId: string | undefined): Style | undefined => {
    return sheet.styles.get(styleId ?? '') ?? sheet.styles.get(sheet.defaultParagraphStyleId ?? '');
};

export const resolveParagraph = (
    sheet: StyleSheet,
    styleId: string | undefined,
    pPr: XmlElement | undefined
): ResolvedParagraph => {
    const style = paragraphStyle(sheet, styleId);
    const styleChain = styleChainOf(sheet, style);
    const numbering = resolveNumbering(sheet, styleChain, childElement(pPr, 'w:numPr'));

    const layers = [
        sheet.paragraphDefaults,
        ...styleChain.map((chainStyle) => chainStyle.paragraph),
        ...(numbering ? [numbering.paragraph] : []),
        parseParagraphFormat(pPr)
    ];
    return {
        style,
        format: applyParagraphLayers(INITIAL_PARAGRAPH_FORMAT, layers),
        numbering
    };
};

export const resolveRun = (
    sheet: StyleSheet,
    paragraphStyleId: string | undefined,
    rPr: XmlElement | undefined
): RunFormat => {
    const characterStyle = sheet.styles.get(childVal(rPr, 'w:rStyle') ?? '');
    const layers = [
        sheet.runDefaults,
        ...styleChainOf(sheet, paragraphStyle(sheet, paragraphStyleId)).map((style) => style.run),
        ...styleChainOf(sheet, characterStyle).map((style) => style.run),
        parseRunFormat(rPr, sheet.themeFonts)
    ];
    return applyRunLayers(INITIAL_RUN_FORMAT, layers);
};

/** The style and its `basedOn` ancestors, the root first. */
const styleChainOf = (sheet: StyleSheet, style: Style | undefined): Style[] => {
    const chain: Style[] = [];
    let current = style;
    while (current && !chain.includes(current)) {
        chain.unshift(current);
        current = sheet.styles.get(current.basedOn ?? '');
    }
    return chain;
};

const resolveNumbering = (
    sheet: StyleSheet,
    styleChain: Style[],
    numPr: XmlElement | undefined
): ResolvedParagraph['numbering'] => {
    const fromStyle = styleChain.reduce<Style['numbering']>(
        (numbering, style) => ({ ...numbering, ...style.numbering }),
        {}
    );
    const numId = childVal(numPr, 'w:numId') ?? fromStyle?.numId;
    const levelValue = childVal(numPr, 'w:ilvl');
    const level = levelValue !== undefined ? Number(levelValue) : (fromStyle?.level ?? 0);

    const numberingLevel = sheet.numbering.get(numId ?? '')?.[level];
    if (!numberingLevel) {
        return undefined;
    }
    return { ...numberingLevel, level };
};

const parseStyle = (style: XmlElement, themeFonts: ThemeFonts): Style => {
    const pPr = childElement(style, 'w:pPr');
    const numPr = childElement(pPr, 'w:numPr');
    const numId = childVal(numPr, 'w:numId');
    const level = childVal(numPr, 'w:ilvl');
    return {
        id: attr(style, 'w:styleId') ?? '',
        name: childVal(style, 'w:name') ?? attr(style, 'w:styleId') ?? '',
        type: attr(style, 'w:type') ?? 'paragraph',
        basedOn: childVal(style, 'w:basedOn'),
        paragraph: parseParagraphFormat(pPr),
        run: parseRunFormat(childElement(style, 'w:rPr'), themeFonts),
        numbering: numPr ? { numId, ...(level !== undefined ? { level: Number(level) } : {}) } : undefined
    };
};

export const parseThemeFonts = (theme: XmlElement | undefined): ThemeFonts => {
    if (!theme) {
        return FALLBACK_THEME_FONTS;
    }
    const latinFont = (tag: string) => {
        const font = descendants(theme, tag)[0];
        return attr(childElement(font, 'a:latin'), 'typeface');
    };
    return {
        major: latinFont('a:majorFont') ?? FALLBACK_THEME_FONTS.major,
        minor: latinFont('a:minorFont') ?? FALLBACK_THEME_FONTS.minor
    };
};

const parseNumbering = (numbering: XmlElement | undefined): Map<string, NumberingLevel[]> => {
    if (!numbering) {
        return new Map();
    }
    const abstractNumberings = new Map(
        childElements(numbering, 'w:abstractNum').map((abstractNum) => [
            attr(abstractNum, 'w:abstractNumId'),
            childElements(abstractNum, 'w:lvl').map(parseNumberingLevel)
        ])
    );
    return new Map(
        childElements(numbering, 'w:num').map((num) => [
            attr(num, 'w:numId') ?? '',
            abstractNumberings.get(childVal(num, 'w:abstractNumId')) ?? []
        ])
    );
};

const parseNumberingLevel = (lvl: XmlElement): NumberingLevel => {
    return {
        format: childVal(lvl, 'w:numFmt') ?? 'decimal',
        text: childVal(lvl, 'w:lvlText') ?? '',
        paragraph: parseParagraphFormat(childElement(lvl, 'w:pPr'))
    };
};
