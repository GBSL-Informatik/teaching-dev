import { halfPointsToPt, twipsToCm, twipsToPt } from './units';
import { attr, childElement, childElements, childVal, XmlElement } from './xml';

export type Alignment = 'left' | 'center' | 'right' | 'justify';

export type LineSpacing =
    { rule: 'multiple'; value: number } | { rule: 'exact' | 'atLeast'; valuePt: number };

export interface TabStop {
    positionCm: number;
    alignment: string;
    leader: string;
}

export interface ParagraphFormat {
    alignment: Alignment;
    indentLeftCm: number;
    indentRightCm: number;
    /** Positive for a first line indent, negative for a hanging indent. */
    indentFirstLineCm: number;
    spacingBeforePt: number;
    spacingAfterPt: number;
    lineSpacing: LineSpacing;
    contextualSpacing: boolean;
    keepWithNext: boolean;
    keepLinesTogether: boolean;
    pageBreakBefore: boolean;
    tabStops: TabStop[];
}

export interface RunFormat {
    font: string;
    sizePt: number;
    bold: boolean;
    italic: boolean;
    underline: string;
    strike: boolean;
    color: string;
    highlight: string;
    allCaps: boolean;
    smallCaps: boolean;
    verticalAlign: string;
}

export interface ThemeFonts {
    major: string;
    minor: string;
}

/** One `w:pPr`: the properties it sets, and the tab stops it adds or clears. */
export interface ParagraphFormatLayer {
    properties: Partial<Omit<ParagraphFormat, 'tabStops'>>;
    tabs: { stop: TabStop; clear: boolean }[];
}

export type RunFormatLayer = Partial<RunFormat>;

/** Values Word uses when neither the document defaults nor a style sets a property. */
export const INITIAL_PARAGRAPH_FORMAT: ParagraphFormat = {
    alignment: 'left',
    indentLeftCm: 0,
    indentRightCm: 0,
    indentFirstLineCm: 0,
    spacingBeforePt: 0,
    spacingAfterPt: 0,
    lineSpacing: { rule: 'multiple', value: 1 },
    contextualSpacing: false,
    keepWithNext: false,
    keepLinesTogether: false,
    pageBreakBefore: false,
    tabStops: []
};

export const INITIAL_RUN_FORMAT: RunFormat = {
    font: 'Times New Roman',
    sizePt: 10,
    bold: false,
    italic: false,
    underline: 'none',
    strike: false,
    color: 'auto',
    highlight: 'none',
    allCaps: false,
    smallCaps: false,
    verticalAlign: 'baseline'
};

const EMPTY_ELEMENT: XmlElement = { tag: '', attrs: {}, children: [] };

// Word's spacing for "Auto" (HTML style spacing) before and after a paragraph.
const AUTO_SPACING_PT = 14;

const ALIGNMENTS: { [jc: string]: Alignment } = {
    left: 'left',
    start: 'left',
    center: 'center',
    right: 'right',
    end: 'right',
    both: 'justify',
    distribute: 'justify'
};

export const parseParagraphFormat = (pPr: XmlElement | undefined): ParagraphFormatLayer => {
    const properties: ParagraphFormatLayer['properties'] = {};
    if (!pPr) {
        return { properties, tabs: [] };
    }

    const jc = childVal(pPr, 'w:jc');
    if (jc && ALIGNMENTS[jc]) {
        properties.alignment = ALIGNMENTS[jc];
    }
    Object.assign(properties, parseIndentation(childElement(pPr, 'w:ind')));
    Object.assign(properties, parseSpacing(childElement(pPr, 'w:spacing')));
    setToggle(properties, 'contextualSpacing', childElement(pPr, 'w:contextualSpacing'));
    setToggle(properties, 'keepWithNext', childElement(pPr, 'w:keepNext'));
    setToggle(properties, 'keepLinesTogether', childElement(pPr, 'w:keepLines'));
    setToggle(properties, 'pageBreakBefore', childElement(pPr, 'w:pageBreakBefore'));

    const tabElements = childElements(childElement(pPr, 'w:tabs') ?? EMPTY_ELEMENT, 'w:tab');
    const tabs = tabElements.map((tab) => ({
        stop: {
            positionCm: twipsToCm(attr(tab, 'w:pos') ?? 0),
            alignment: attr(tab, 'w:val') ?? 'left',
            leader: attr(tab, 'w:leader') ?? 'none'
        },
        clear: attr(tab, 'w:val') === 'clear'
    }));
    return { properties, tabs };
};

export const parseRunFormat = (rPr: XmlElement | undefined, themeFonts: ThemeFonts): RunFormatLayer => {
    const format: RunFormatLayer = {};
    if (!rPr) {
        return format;
    }

    const font = parseFont(childElement(rPr, 'w:rFonts'), themeFonts);
    if (font) {
        format.font = font;
    }
    const size = childVal(rPr, 'w:sz');
    if (size) {
        format.sizePt = halfPointsToPt(size);
    }
    setToggle(format, 'bold', childElement(rPr, 'w:b'));
    setToggle(format, 'italic', childElement(rPr, 'w:i'));
    setToggle(format, 'strike', childElement(rPr, 'w:strike'));
    setToggle(format, 'allCaps', childElement(rPr, 'w:caps'));
    setToggle(format, 'smallCaps', childElement(rPr, 'w:smallCaps'));

    const underline = childVal(rPr, 'w:u');
    if (underline) {
        format.underline = underline;
    }
    const color = childVal(rPr, 'w:color');
    if (color) {
        format.color = color === 'auto' ? 'auto' : color.toUpperCase();
    }
    const highlight = childVal(rPr, 'w:highlight');
    if (highlight) {
        format.highlight = highlight;
    }
    const verticalAlign = childVal(rPr, 'w:vertAlign');
    if (verticalAlign) {
        format.verticalAlign = verticalAlign;
    }
    return format;
};

export const applyParagraphLayers = (
    base: ParagraphFormat,
    layers: ParagraphFormatLayer[]
): ParagraphFormat => {
    return layers.reduce<ParagraphFormat>((format, layer) => {
        const tabStops = layer.tabs.reduce((stops, { stop, clear }) => {
            const others = stops.filter((other) => other.positionCm !== stop.positionCm);
            return clear ? others : [...others, stop];
        }, format.tabStops);
        return {
            ...format,
            ...layer.properties,
            tabStops: tabStops.sort((a, b) => a.positionCm - b.positionCm)
        };
    }, base);
};

export const applyRunLayers = (base: RunFormat, layers: RunFormatLayer[]): RunFormat => {
    // Word toggles bold/italic when both a style and its base style set them; documents
    // created through the UI do not rely on that, so later layers simply override.
    return layers.reduce<RunFormat>((format, layer) => ({ ...format, ...layer }), base);
};

const parseIndentation = (ind: XmlElement | undefined): ParagraphFormatLayer['properties'] => {
    if (!ind) {
        return {};
    }
    const properties: ParagraphFormatLayer['properties'] = {};
    const left = attr(ind, 'w:left') ?? attr(ind, 'w:start');
    const right = attr(ind, 'w:right') ?? attr(ind, 'w:end');
    const firstLine = attr(ind, 'w:firstLine');
    const hanging = attr(ind, 'w:hanging');
    if (left !== undefined) {
        properties.indentLeftCm = twipsToCm(left);
    }
    if (right !== undefined) {
        properties.indentRightCm = twipsToCm(right);
    }
    if (firstLine !== undefined) {
        properties.indentFirstLineCm = twipsToCm(firstLine);
    }
    if (hanging !== undefined) {
        properties.indentFirstLineCm = -twipsToCm(hanging);
    }
    return properties;
};

const parseSpacing = (spacing: XmlElement | undefined): ParagraphFormatLayer['properties'] => {
    if (!spacing) {
        return {};
    }
    const properties: ParagraphFormatLayer['properties'] = {};
    const before = attr(spacing, 'w:before');
    const after = attr(spacing, 'w:after');
    const line = attr(spacing, 'w:line');
    if (before !== undefined) {
        properties.spacingBeforePt = twipsToPt(before);
    }
    if (after !== undefined) {
        properties.spacingAfterPt = twipsToPt(after);
    }
    if (isOn(attr(spacing, 'w:beforeAutospacing'))) {
        properties.spacingBeforePt = AUTO_SPACING_PT;
    }
    if (isOn(attr(spacing, 'w:afterAutospacing'))) {
        properties.spacingAfterPt = AUTO_SPACING_PT;
    }
    if (line !== undefined) {
        properties.lineSpacing = parseLineSpacing(line, attr(spacing, 'w:lineRule'));
    }
    return properties;
};

const parseLineSpacing = (line: string, rule: string | undefined): LineSpacing => {
    if (rule === 'exact' || rule === 'atLeast') {
        return { rule, valuePt: twipsToPt(line) };
    }
    // "auto" lines are measured in 240ths of a line.
    return { rule: 'multiple', value: Math.round((Number(line) / 240) * 100) / 100 };
};

const parseFont = (rFonts: XmlElement | undefined, themeFonts: ThemeFonts): string | undefined => {
    const theme = attr(rFonts, 'w:asciiTheme');
    if (theme) {
        return theme.startsWith('major') ? themeFonts.major : themeFonts.minor;
    }
    return attr(rFonts, 'w:ascii');
};

const setToggle = <T extends object>(target: T, key: keyof T, element: XmlElement | undefined) => {
    if (!element) {
        return;
    }
    (target[key] as boolean) = isOn(attr(element, 'w:val') ?? 'true');
};

export const isOn = (value: string | undefined) => {
    return value !== undefined && !['0', 'false', 'off'].includes(value);
};
