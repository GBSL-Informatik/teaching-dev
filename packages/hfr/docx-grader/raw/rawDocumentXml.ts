import { Block, DocModel, Image, Paragraph, TableCell } from '../docx/DocModel';

export interface ImageFile {
    /** Id of the picture's relationship in the raw document. */
    relationshipId: string;
    path: string;
}

const NAMESPACES = [
    'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"',
    'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"',
    'xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"',
    'xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"',
    'xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"'
].join(' ');

/** All images get the same width, so their size is part of the formatting task. */
const IMAGE_WIDTH_CM = 5;
const EMU_PER_CM = 360000;
// Text width of an A4 page with Word's default margins, shared by the columns of a table.
const TEXT_WIDTH_TWIPS = 9072;

/** A4 with Word's default margins, see `WORD_DEFAULT_SECTION`. */
const SECTION_XML =
    '<w:sectPr><w:pgSz w:w="11906" w:h="16838"/>' +
    '<w:pgMar w:top="1417" w:right="1417" w:bottom="1134" w:left="1417" w:header="708" w:footer="708" w:gutter="0"/>' +
    '<w:cols w:space="708"/></w:sectPr>';

export const rawDocumentXml = (model: DocModel, imageFiles: Map<string, ImageFile>): string => {
    const writer = new RawDocumentWriter(model, imageFiles);
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document ${NAMESPACES}><w:body>${writer.blocksXml(model.blocks)}${SECTION_XML}</w:body></w:document>`;
};

class RawDocumentWriter {
    private readonly model: DocModel;
    private readonly imageFiles: Map<string, ImageFile>;

    constructor(model: DocModel, imageFiles: Map<string, ImageFile>) {
        this.model = model;
        this.imageFiles = imageFiles;
    }

    /** Adjacent tables are kept apart by an empty paragraph, as Word would merge them. */
    blocksXml(blocks: Block[]): string {
        return blocks
            .map((block) =>
                block.type === 'table'
                    ? this.tableXml(block.rows)
                    : this.paragraphXml(this.model.paragraphs[block.paragraphIndex])
            )
            .filter(Boolean)
            .reduce((xml, blockXml) => {
                const separator = endsWithTable(xml) && blockXml.startsWith('<w:tbl>') ? EMPTY_PARAGRAPH : '';
                return `${xml}${separator}${blockXml}`;
            }, '');
    }

    /**
     * Images come first, each in a paragraph of its own; generated paragraphs (e.g. the table of
     * contents) and empty ones are left out, as are caption labels, which students insert.
     */
    private paragraphXml(paragraph: Paragraph): string {
        const images = this.model.images.filter((image) => image.paragraphIndex === paragraph.index);
        const imageParagraphs = images.map((image) => `<w:p>${this.imageXml(image)}</w:p>`).join('');
        const text = paragraph.caption?.description ?? paragraph.text;
        if (paragraph.generatedBy || !text.trim()) {
            return imageParagraphs;
        }
        return `${imageParagraphs}<w:p>${runsXml(text)}</w:p>`;
    }

    private tableXml(rows: TableCell[][]): string {
        if (rows.length === 0) {
            return '';
        }
        const columnCount = Math.max(
            1,
            ...rows.map((row) => row.reduce((sum, cell) => sum + cell.gridSpan, 0))
        );
        const columnWidth = Math.floor(TEXT_WIDTH_TWIPS / columnCount);
        const grid = `<w:tblGrid>${`<w:gridCol w:w="${columnWidth}"/>`.repeat(columnCount)}</w:tblGrid>`;
        const rowsXml = rows.map((row) => `<w:tr>${row.map((cell) => this.cellXml(cell)).join('')}</w:tr>`);
        return `<w:tbl><w:tblPr><w:tblW w:w="0" w:type="auto"/></w:tblPr>${grid}${rowsXml.join('')}</w:tbl>`;
    }

    private cellXml(cell: TableCell): string {
        const gridSpan = cell.gridSpan > 1 ? `<w:gridSpan w:val="${cell.gridSpan}"/>` : '';
        const verticalMerge = cell.verticalMerge ? `<w:vMerge w:val="${cell.verticalMerge}"/>` : '';
        // A cell must end with a paragraph, also when its content was left out or ends with a table.
        const blocksXml = this.blocksXml(cell.blocks);
        const content = !blocksXml || endsWithTable(blocksXml) ? `${blocksXml}${EMPTY_PARAGRAPH}` : blocksXml;
        return `<w:tc><w:tcPr>${gridSpan}${verticalMerge}</w:tcPr>${content}</w:tc>`;
    }

    private imageXml(image: Image): string {
        const file = this.imageFiles.get(image.relationshipId ?? '');
        if (!file) {
            return '';
        }
        const width = IMAGE_WIDTH_CM * EMU_PER_CM;
        const height = Math.round(width * (image.heightCm / image.widthCm || 1));
        const id = image.index + 1;
        const extent = `cx="${width}" cy="${height}"`;
        return (
            `<w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent ${extent}/>` +
            `<wp:docPr id="${id}" name="Bild ${id}"/>` +
            '<a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic>' +
            `<pic:nvPicPr><pic:cNvPr id="${id}" name="Bild ${id}"/><pic:cNvPicPr/></pic:nvPicPr>` +
            `<pic:blipFill><a:blip r:embed="${file.relationshipId}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill>` +
            `<pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext ${extent}/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr>` +
            '</pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r>'
        );
    }
}

const EMPTY_PARAGRAPH = '<w:p/>';

const endsWithTable = (xml: string) => xml.endsWith('</w:tbl>');

/** Tabs and line breaks are content, everything else is plain text. */
const runsXml = (text: string): string => {
    const parts = text.split(/(\t|\n)/).filter(Boolean);
    const content = parts.map((part) => {
        if (part === '\t') {
            return '<w:tab/>';
        }
        if (part === '\n') {
            return '<w:br/>';
        }
        return `<w:t xml:space="preserve">${escapeXml(part)}</w:t>`;
    });
    return `<w:r>${content.join('')}</w:r>`;
};

const escapeXml = (text: string) => {
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
};
