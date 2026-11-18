import { ParagraphFormat, RunFormat } from './formatting';
import { StyleSheet } from './styleSheet';

export type FieldType =
    | 'tableOfContents'
    | 'tableOfFigures'
    | 'bibliography'
    | 'citation'
    | 'sequence'
    | 'pageNumber'
    | 'pageCount'
    | 'other';

export interface Field {
    type: FieldType;
    instruction: string;
    /** Caption label of `SEQ` fields and tables of figures, e.g. `Abbildung`. */
    label?: string;
    /** Heading levels of a table of contents, e.g. `1-3`. */
    levels?: string;
}

export interface TextRun {
    text: string;
    format: RunFormat;
    /** Set when the text is the result of a field, e.g. a page number. */
    field?: FieldType;
}

export interface Caption {
    /** The `SEQ` label, e.g. `Abbildung`; missing when the caption was typed by hand. */
    label?: string;
    /** The caption text without its label and number. */
    description: string;
}

export interface Paragraph {
    index: number;
    /** Visible text, including field results such as citations or cross references. */
    text: string;
    runs: TextRun[];
    style: { id: string; name: string };
    format: ParagraphFormat;
    numbering?: { level: number; format: string; text: string };
    fields: Field[];
    caption?: Caption;
    /** Set when the paragraph is output of a field, e.g. an entry of the table of contents. */
    generatedBy?: FieldType;
    container: 'body' | 'table' | 'textBox';
    sectionIndex: number;
}

export interface Image {
    index: number;
    paragraphIndex: number;
    widthCm: number;
    heightCm: number;
    placement: 'inline' | 'anchored';
    /** Text wrapping of anchored images, e.g. `square`, `topAndBottom`, `behindText`. */
    wrap?: string;
    caption?: Caption;
}

export interface HeaderFooter {
    kind: 'header' | 'footer';
    /** `default`, `first` or `even` */
    variant: string;
    paragraphs: Paragraph[];
}

export interface Section {
    index: number;
    /** How the section starts, e.g. `nextPage` or `continuous`. */
    breakType: string;
    orientation: 'portrait' | 'landscape';
    marginsCm: { top: number; right: number; bottom: number; left: number };
    columns: { count: number; spacingCm: number; separator: boolean };
    pageNumberFormat: string;
    pageNumberStart?: number;
    titlePage: boolean;
    headersAndFooters: HeaderFooter[];
}

export interface DocModel {
    paragraphs: Paragraph[];
    images: Image[];
    fields: Field[];
    sections: Section[];
    styleSheet: StyleSheet;
    autoHyphenation: boolean;
    /** Whether even pages use the `even` headers and footers. */
    evenAndOddHeaders: boolean;
}
