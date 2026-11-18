import JSZip from 'jszip';
import { WORD_DEFAULT_STYLES_XML } from '../baseline/wordDefaults';
import { buildDocModel } from '../docx/buildDocModel';
import { readDocx, Relationship } from '../docx/readDocx';
import {
    contentTypesXml,
    documentRelationshipsXml,
    isSupportedImage,
    PACKAGE_RELATIONSHIPS_XML,
    SETTINGS_XML
} from './packageParts';
import { ImageFile, rawDocumentXml } from './rawDocumentXml';

const THEME_PATH = 'word/theme/theme1.xml';
// A fixed date makes the output depend on the original only, so regenerating does not change the file.
const FILE_OPTIONS = { date: new Date('2000-01-01T00:00:00Z') };

/**
 * The text, images and tables of the original without any formatting, for students to format:
 * default styles, one section, no headers, footers, captions labels, lists or directories.
 * The theme is kept, as its fonts are what «Calibri» and the other defaults resolve to.
 */
export interface RawDocx {
    data: Uint8Array;
    /** Images that could not be embedded, e.g. linked ones or of an unknown file type. */
    skippedImageCount: number;
}

export const createRawDocx = async (original: Uint8Array): Promise<RawDocx> => {
    const docx = await readDocx(original);
    const model = buildDocModel(docx);
    const originalZip = await JSZip.loadAsync(original);

    const imageFiles = imageFilesOf(
        model.images.map((image) => image.relationshipId),
        docx.relationships
    );
    const imagePaths = [...imageFiles.values()].map((file) => file.path);
    const hasTheme = !!originalZip.file(THEME_PATH);

    const raw = new JSZip();
    raw.file('[Content_Types].xml', contentTypesXml(imagePaths, hasTheme), FILE_OPTIONS);
    raw.file('_rels/.rels', PACKAGE_RELATIONSHIPS_XML, FILE_OPTIONS);
    raw.file('word/document.xml', rawDocumentXml(model, imageFiles), FILE_OPTIONS);
    raw.file(
        'word/_rels/document.xml.rels',
        documentRelationshipsXml([...imageFiles.values()], hasTheme),
        FILE_OPTIONS
    );
    raw.file('word/styles.xml', WORD_DEFAULT_STYLES_XML, FILE_OPTIONS);
    raw.file('word/settings.xml', SETTINGS_XML, FILE_OPTIONS);
    await copyFile(originalZip, raw, THEME_PATH);
    for (const path of imagePaths) {
        await copyFile(originalZip, raw, path);
    }
    const embeddedImages = model.images.filter((image) => imageFiles.has(image.relationshipId ?? ''));
    return {
        data: await raw.generateAsync({ type: 'uint8array', compression: 'DEFLATE' }),
        skippedImageCount: model.images.length - embeddedImages.length
    };
};

/** One new relationship per picture file, by the original relationship id. */
const imageFilesOf = (
    relationshipIds: (string | undefined)[],
    relationships: Map<string, Relationship>
): Map<string, ImageFile> => {
    const files = new Map<string, ImageFile>();
    for (const id of relationshipIds) {
        const relationship = relationships.get(id ?? '');
        if (!id || !relationship || files.has(id) || !isSupportedImage(relationship.path)) {
            continue;
        }
        files.set(id, { relationshipId: `rIdImage${files.size + 1}`, path: relationship.path });
    }
    return files;
};

const copyFile = async (from: JSZip, to: JSZip, path: string) => {
    const file = from.file(path);
    if (file) {
        to.file(path, await file.async('uint8array'), FILE_OPTIONS);
    }
};
