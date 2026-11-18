import JSZip from 'jszip';
import { attr, childElements, parseXml, XmlElement } from './xml';

export interface DocxPackage {
    document: XmlElement;
    styles?: XmlElement;
    numbering?: XmlElement;
    theme?: XmlElement;
    settings?: XmlElement;
    /** Header and footer parts, by the relationship id `w:headerReference`/`w:footerReference` point to. */
    headersAndFooters: Map<string, XmlElement>;
}

const HEADER_FOOTER_TYPE = /\/(header|footer)$/;

export const readDocx = async (data: ArrayBuffer | Uint8Array): Promise<DocxPackage> => {
    const zip = await JSZip.loadAsync(data);
    const readPart = async (path: string) => {
        const file = zip.file(path);
        return file ? parseXml(await file.async('string')) : undefined;
    };

    // Word always stores the main document part at this path.
    const document = await readPart('word/document.xml');
    if (!document) {
        throw new Error('Die Datei ist kein Word-Dokument (word/document.xml fehlt).');
    }

    const relationships = await readPart('word/_rels/document.xml.rels');
    const headersAndFooters = new Map<string, XmlElement>();
    for (const relationship of relationships ? childElements(relationships, 'Relationship') : []) {
        if (!HEADER_FOOTER_TYPE.test(attr(relationship, 'Type') ?? '')) {
            continue;
        }
        const part = await readPart(partPath(attr(relationship, 'Target')!));
        if (part) {
            headersAndFooters.set(attr(relationship, 'Id')!, part);
        }
    }

    return {
        document,
        // Like the main document part, Word always stores these parts at fixed paths.
        styles: await readPart('word/styles.xml'),
        numbering: await readPart('word/numbering.xml'),
        theme: await readPart('word/theme/theme1.xml'),
        settings: await readPart('word/settings.xml'),
        headersAndFooters
    };
};

/** Relationship targets are relative to `word/`, unless they are absolute within the package. */
const partPath = (target: string) => {
    return target.startsWith('/') ? target.slice(1) : `word/${target}`;
};
