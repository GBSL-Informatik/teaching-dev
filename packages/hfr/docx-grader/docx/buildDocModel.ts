import { Caption, DocModel, Field, FieldType, Image, Paragraph, TextRun } from './DocModel';
import { GENERATING_FIELDS, parseField } from './fields';
import { isOn } from './formatting';
import { DocxPackage } from './readDocx';
import { buildSections } from './sections';
import { parseStyleSheet, parseThemeFonts, resolveParagraph, resolveRun, StyleSheet } from './styleSheet';
import { emuToCm } from './units';
import { attr, childElement, childElements, childVal, descendants, textContent, XmlElement } from './xml';

type Container = Paragraph['container'];

interface OpenField {
    instruction: string;
    field?: Field;
}

/** State while reading the inline content of one paragraph. */
interface ParagraphState {
    styleId?: string;
    runs: TextRun[];
    fields: Field[];
    images: Omit<Image, 'index' | 'paragraphIndex'>[];
    /** Text boxes and the images drawn in the same drawing, e.g. a group of an image and its caption. */
    textBoxes: { content: XmlElement; drawingImages: { first: number; count: number } }[];
    generatedBy?: Paragraph['generatedBy'];
    sequence?: { label?: string; textEnd: number };
}

const SKIPPED_INLINE = new Set([
    'w:pPr',
    'w:del',
    'w:moveFrom',
    'w:proofErr',
    'w:bookmarkStart',
    'w:bookmarkEnd'
]);
const TRANSPARENT_INLINE = new Set([
    'w:hyperlink',
    'w:ins',
    'w:moveTo',
    'w:smartTag',
    'w:customXml',
    'w:dir',
    'w:bdo'
]);
const WRAP_TYPES: { [tag: string]: string } = {
    'wp:wrapSquare': 'square',
    'wp:wrapTight': 'tight',
    'wp:wrapThrough': 'through',
    'wp:wrapTopAndBottom': 'topAndBottom'
};
/** Building blocks Word inserts as a whole, including a heading such as «Inhaltsverzeichnis». */
const GENERATED_BUILDING_BLOCKS: { [gallery: string]: FieldType } = {
    'Table of Contents': 'tableOfContents',
    Bibliographies: 'bibliography'
};
const TYPED_CAPTION_LABEL = /^\s*(Abbildung|Abb\.|Tabelle|Tab\.|Figure|Fig\.|Table)\s*\d+(\.\d+)*/;

export const buildDocModel = (docx: DocxPackage): DocModel => {
    const styleSheet = parseStyleSheet(docx.styles, docx.numbering, parseThemeFonts(docx.theme));
    const builder = new DocModelBuilder(styleSheet);
    builder.readBlocks(childElement(docx.document, 'w:body')!, 'body');

    const paragraphs = builder.paragraphs;
    const readPart = (relationshipId: string) => {
        const part = docx.headersAndFooters.get(relationshipId);
        if (!part) {
            return [];
        }
        const partBuilder = new DocModelBuilder(styleSheet);
        partBuilder.readBlocks(part, 'body');
        return partBuilder.paragraphs;
    };

    return {
        paragraphs,
        images: attachAdjacentCaptions(builder.images, paragraphs),
        fields: paragraphs.filter((paragraph) => paragraph.container !== 'textBox').flatMap((p) => p.fields),
        sections: buildSections(builder.sectionProperties, readPart),
        styleSheet,
        autoHyphenation: isSettingOn(docx.settings, 'w:autoHyphenation'),
        evenAndOddHeaders: isSettingOn(docx.settings, 'w:evenAndOddHeaders')
    };
};

class DocModelBuilder {
    readonly paragraphs: Paragraph[];
    readonly images: Image[];
    /** One `w:sectPr` per section, in document order. */
    readonly sectionProperties: XmlElement[];
    private readonly styleSheet: StyleSheet;
    /** Complex fields can span several paragraphs, e.g. a table of contents. */
    private openFields: OpenField[];
    private buildingBlock?: FieldType;

    constructor(styleSheet: StyleSheet) {
        this.styleSheet = styleSheet;
        this.paragraphs = [];
        this.images = [];
        this.sectionProperties = [];
        this.openFields = [];
    }

    readBlocks(container: XmlElement, kind: Container) {
        for (const block of childElements(container)) {
            switch (block.tag) {
                case 'w:p':
                    this.readParagraph(block, kind);
                    break;
                case 'w:tbl':
                    this.readTable(block);
                    break;
                case 'w:sdt':
                    this.readContentControl(block, kind);
                    break;
                case 'w:customXml':
                    this.readBlocks(block, kind);
                    break;
                case 'w:sectPr':
                    this.sectionProperties.push(block);
                    break;
            }
        }
    }

    private readTable(table: XmlElement) {
        for (const row of unwrappedChildren(table, 'w:tr')) {
            for (const cell of unwrappedChildren(row, 'w:tc')) {
                this.readBlocks(cell, 'table');
            }
        }
    }

    private readContentControl(sdt: XmlElement, kind: Container) {
        const properties = childElement(sdt, 'w:sdtPr');
        const gallery = properties && attr(descendants(properties, 'w:docPartGallery')[0], 'w:val');
        const outerBuildingBlock = this.buildingBlock;
        this.buildingBlock ??= GENERATED_BUILDING_BLOCKS[gallery ?? ''];
        this.readBlocks(childElement(sdt, 'w:sdtContent') ?? sdt, kind);
        this.buildingBlock = outerBuildingBlock;
    }

    private readParagraph(p: XmlElement, container: Container) {
        const pPr = childElement(p, 'w:pPr');
        const styleId = childVal(pPr, 'w:pStyle');
        const state: ParagraphState = { styleId, runs: [], fields: [], images: [], textBoxes: [] };
        this.readInline(p, state);
        // A field instruction never continues in the next paragraph: drop fields Word left unterminated.
        this.openFields = this.openFields.filter((open) => open.field);

        const resolved = resolveParagraph(this.styleSheet, styleId, pPr);
        const text = state.runs.map((run) => run.text).join('');
        const paragraph: Paragraph = {
            index: this.paragraphs.length,
            text,
            runs: state.runs,
            style: { id: resolved.style?.id ?? '', name: resolved.style?.name ?? 'Normal' },
            format: resolved.format,
            numbering: resolved.numbering && {
                level: resolved.numbering.level,
                format: resolved.numbering.format,
                text: resolved.numbering.text
            },
            fields: state.fields,
            caption: captionOf(text, resolved.style?.name, state.sequence),
            generatedBy: state.generatedBy ?? this.buildingBlock,
            container,
            sectionIndex: this.sectionProperties.length
        };
        this.paragraphs.push(paragraph);
        this.addImagesAndTextBoxes(paragraph, state);

        const sectPr = childElement(pPr, 'w:sectPr');
        if (sectPr) {
            this.sectionProperties.push(sectPr);
        }
    }

    /** Images of the paragraph, then the paragraphs of its text boxes, whose caption belongs to the images drawn with them. */
    private addImagesAndTextBoxes(paragraph: Paragraph, state: ParagraphState) {
        const images = state.images.map((image) => ({
            ...image,
            index: this.images.length,
            paragraphIndex: paragraph.index
        }));
        images.forEach((image) => this.images.push(image));

        for (const { content, drawingImages } of state.textBoxes) {
            const caption = this.readTextBox(content);
            const groupedImages = images.slice(
                drawingImages.first,
                drawingImages.first + drawingImages.count
            );
            groupedImages.forEach((image) => (image.caption ??= caption));
        }
    }

    /** Reads the paragraphs of a text box and returns the first caption among them. */
    private readTextBox(content: XmlElement): Caption | undefined {
        const outerFields = this.openFields;
        const firstParagraph = this.paragraphs.length;
        this.openFields = [];
        this.readBlocks(content, 'textBox');
        this.openFields = outerFields;
        return this.paragraphs.slice(firstParagraph).find((paragraph) => paragraph.caption)?.caption;
    }

    private readInline(element: XmlElement, state: ParagraphState) {
        for (const child of childElements(element)) {
            if (SKIPPED_INLINE.has(child.tag)) {
                continue;
            }
            if (TRANSPARENT_INLINE.has(child.tag)) {
                this.readInline(child, state);
                continue;
            }
            switch (child.tag) {
                case 'w:r':
                    this.readRun(child, state);
                    break;
                case 'w:sdt':
                    this.readInline(childElement(child, 'w:sdtContent') ?? child, state);
                    break;
                case 'w:fldSimple':
                    this.beginField(attr(child, 'w:instr') ?? '');
                    this.separateField(state);
                    this.readInline(child, state);
                    this.endField(state);
                    break;
            }
        }
    }

    private readRun(r: XmlElement, state: ParagraphState) {
        const rPr = childElement(r, 'w:rPr');
        const addText = (text: string) => {
            if (this.isInFieldInstruction()) {
                return;
            }
            this.markGeneratedContent(state);
            state.runs.push({
                text,
                format: resolveRun(this.styleSheet, state.styleId, rPr),
                field: this.openFields.at(-1)?.field?.type
            });
        };

        for (const child of childElements(r)) {
            switch (child.tag) {
                case 'w:t':
                    addText(textContent(child));
                    break;
                case 'w:tab':
                    addText('\t');
                    break;
                case 'w:br':
                case 'w:cr':
                    // Page and column breaks are layout, not text.
                    if (!attr(child, 'w:type') || attr(child, 'w:type') === 'textWrapping') {
                        addText('\n');
                    }
                    break;
                case 'w:noBreakHyphen':
                    addText('-');
                    break;
                case 'w:fldChar':
                    this.readFieldChar(attr(child, 'w:fldCharType'), state);
                    break;
                case 'w:instrText':
                    this.appendFieldInstruction(textContent(child));
                    break;
                case 'w:drawing':
                    this.readDrawing(child, state);
                    break;
                case 'mc:AlternateContent':
                    // mc:Fallback repeats the same content as legacy VML.
                    this.readRun(childElement(child, 'mc:Choice') ?? child, state);
                    break;
            }
        }
    }

    private readDrawing(drawing: XmlElement, state: ParagraphState) {
        const frame = childElement(drawing, 'wp:inline') ?? childElement(drawing, 'wp:anchor');
        if (!frame) {
            return;
        }
        // Pictures inside a text box are read with the text box's paragraphs.
        const pictureCount = descendants(frame, 'pic:pic', 'w:txbxContent').length;
        const drawingImages = { first: state.images.length, count: pictureCount };
        const extent = childElement(frame, 'wp:extent');
        for (let i = 0; i < pictureCount; i++) {
            state.images.push({
                widthCm: emuToCm(attr(extent, 'cx') ?? 0),
                heightCm: emuToCm(attr(extent, 'cy') ?? 0),
                placement: frame.tag === 'wp:inline' ? 'inline' : 'anchored',
                wrap: frame.tag === 'wp:anchor' ? wrapOf(frame) : undefined
            });
        }
        descendants(frame, 'w:txbxContent').forEach((content) =>
            state.textBoxes.push({ content, drawingImages })
        );
    }

    private readFieldChar(type: string | undefined, state: ParagraphState) {
        if (type === 'begin') {
            this.beginField('');
        } else if (type === 'separate') {
            this.separateField(state);
        } else if (type === 'end') {
            this.endField(state);
        }
    }

    private beginField(instruction: string) {
        this.openFields.push({ instruction });
    }

    private appendFieldInstruction(text: string) {
        const current = this.openFields.at(-1);
        if (current && !current.field) {
            current.instruction += text;
        }
    }

    private separateField(state: ParagraphState) {
        const current = this.openFields.at(-1);
        if (!current || current.field) {
            return;
        }
        current.field = parseField(current.instruction);
        state.fields.push(current.field);
    }

    private endField(state: ParagraphState) {
        this.separateField(state);
        const field = this.openFields.pop()?.field;
        if (field?.type === 'sequence') {
            state.sequence = {
                label: field.label,
                textEnd: state.runs.reduce((length, run) => length + run.text.length, 0)
            };
        }
    }

    /** Text is part of a field instruction until the field's `separate` mark. */
    private isInFieldInstruction() {
        return this.openFields.some((open) => !open.field);
    }

    private markGeneratedContent(state: ParagraphState) {
        const generating = this.openFields.find(
            (open) => open.field && GENERATING_FIELDS.includes(open.field.type)
        );
        if (generating) {
            state.generatedBy ??= generating.field!.type;
        }
    }
}

/** Children with the tag, also when wrapped in content controls or custom XML. */
const unwrappedChildren = (element: XmlElement, tag: string): XmlElement[] => {
    return childElements(element).flatMap((child) => {
        if (child.tag === 'w:sdt') {
            return unwrappedChildren(childElement(child, 'w:sdtContent') ?? child, tag);
        }
        if (child.tag === 'w:customXml') {
            return unwrappedChildren(child, tag);
        }
        return child.tag === tag ? [child] : [];
    });
};

const captionOf = (
    text: string,
    styleName: string | undefined,
    sequence: ParagraphState['sequence']
): Caption | undefined => {
    if (sequence) {
        return { label: sequence.label, description: stripCaptionSeparator(text.slice(sequence.textEnd)) };
    }
    if (styleName === 'caption' && text.trim()) {
        return { description: stripCaptionSeparator(text.replace(TYPED_CAPTION_LABEL, '')) };
    }
    return undefined;
};

const stripCaptionSeparator = (text: string) => text.replace(/^[\s:.\-–—]+/, '').trim();

const wrapOf = (anchor: XmlElement): string => {
    const wrap = childElements(anchor).find((child) => WRAP_TYPES[child.tag]);
    if (wrap) {
        return WRAP_TYPES[wrap.tag];
    }
    return attr(anchor, 'behindDoc') === '1' ? 'behindText' : 'inFrontOfText';
};

/** A caption belongs to an image when it is the paragraph right after or before the image. */
const attachAdjacentCaptions = (images: Image[], paragraphs: Paragraph[]): Image[] => {
    return images.map((image) => {
        if (image.caption) {
            return image;
        }
        const next = paragraphs[image.paragraphIndex + 1];
        const previous = paragraphs[image.paragraphIndex - 1];
        return { ...image, caption: next?.caption ?? previous?.caption };
    });
};

const isSettingOn = (settings: XmlElement | undefined, tag: string) => {
    const setting = childElement(settings, tag);
    return !!setting && isOn(attr(setting, 'w:val') ?? 'true');
};
