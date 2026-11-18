import JSZip from 'jszip';
import { buildDocModel } from '../docx/buildDocModel';
import { readDocx } from '../docx/readDocx';

const NAMESPACES = [
    'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"',
    'xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"',
    'xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"',
    'xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"',
    'xmlns:wps="http://schemas.microsoft.com/office/word/2010/wordprocessingShape"'
].join(' ');

/** A minimal document with the given body content, for structures the sample documents lack. */
export const docModelOf = async (bodyXml: string, stylesXml?: string, numberingXml?: string) => {
    const zip = new JSZip();
    zip.file(
        'word/document.xml',
        `<w:document ${NAMESPACES}><w:body>${bodyXml}<w:sectPr/></w:body></w:document>`
    );
    if (stylesXml) {
        zip.file('word/styles.xml', `<w:styles ${NAMESPACES}>${stylesXml}</w:styles>`);
    }
    if (numberingXml) {
        zip.file('word/numbering.xml', `<w:numbering ${NAMESPACES}>${numberingXml}</w:numbering>`);
    }
    return buildDocModel(await readDocx(await zip.generateAsync({ type: 'uint8array' })));
};

/** A `Normal` style with the given paragraph properties. */
export const normalStyle = (pPr: string) =>
    `<w:style w:type="paragraph" w:default="1" w:styleId="Standard"><w:name w:val="Normal"/><w:pPr>${pPr}</w:pPr></w:style>`;

export const paragraph = (text: string) => `<w:p><w:r><w:t>${text}</w:t></w:r></w:p>`;

/** An inline picture of the given width. */
export const picture = (widthCm: number) =>
    `<w:r><w:drawing><wp:inline><wp:extent cx="${widthCm * 360000}" cy="360000"/>` +
    '<a:graphic><a:graphicData><pic:pic/></a:graphicData></a:graphic></wp:inline></w:drawing></w:r>';
