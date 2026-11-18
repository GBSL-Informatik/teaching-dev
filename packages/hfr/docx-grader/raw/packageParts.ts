import { ImageFile } from './rawDocumentXml';

const XML_DECLARATION = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
const RELATIONSHIP_TYPES = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
const CONTENT_TYPES = 'application/vnd.openxmlformats-officedocument';

const IMAGE_CONTENT_TYPES: { [extension: string]: string } = {
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    bmp: 'image/bmp',
    tif: 'image/tiff',
    tiff: 'image/tiff',
    emf: 'image/x-emf',
    wmf: 'image/x-wmf',
    svg: 'image/svg+xml'
};

export const PACKAGE_RELATIONSHIPS_XML = `${XML_DECLARATION}
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${RELATIONSHIP_TYPES}/officeDocument" Target="word/document.xml"/></Relationships>`;

/** Without the compatibility mode of the current Word, documents open in compatibility mode. */
export const SETTINGS_XML = `${XML_DECLARATION}
<w:settings xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:defaultTabStop w:val="708"/><w:characterSpacingControl w:val="doNotCompress"/><w:compat><w:compatSetting w:name="compatibilityMode" w:uri="http://schemas.microsoft.com/office/word" w:val="15"/></w:compat></w:settings>`;

/** Word rejects a package with a file whose type is unknown, so other images are left out. */
export const isSupportedImage = (path: string) => !!IMAGE_CONTENT_TYPES[extensionOf(path)];

const extensionOf = (path: string) => path.split('.').pop()!.toLowerCase();

export const contentTypesXml = (imagePaths: string[], hasTheme: boolean) => {
    const extensions = new Set(imagePaths.map(extensionOf));
    const imageDefaults = [...extensions]
        .filter((extension) => IMAGE_CONTENT_TYPES[extension])
        .map(
            (extension) =>
                `<Default Extension="${extension}" ContentType="${IMAGE_CONTENT_TYPES[extension]}"/>`
        );
    const overrides = [
        override('/word/document.xml', 'wordprocessingml.document.main+xml'),
        override('/word/styles.xml', 'wordprocessingml.styles+xml'),
        override('/word/settings.xml', 'wordprocessingml.settings+xml'),
        ...(hasTheme ? [override('/word/theme/theme1.xml', 'theme+xml')] : [])
    ];
    return `${XML_DECLARATION}
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>${imageDefaults.join('')}${overrides.join('')}</Types>`;
};

export const documentRelationshipsXml = (imageFiles: ImageFile[], hasTheme: boolean) => {
    const relationships = [
        relationship('rIdStyles', 'styles', 'styles.xml'),
        relationship('rIdSettings', 'settings', 'settings.xml'),
        ...(hasTheme ? [relationship('rIdTheme', 'theme', 'theme/theme1.xml')] : []),
        // Paths are package paths, targets are relative to `word/`.
        ...imageFiles.map((file) => relationship(file.relationshipId, 'image', `/${file.path}`))
    ];
    return `${XML_DECLARATION}
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${relationships.join('')}</Relationships>`;
};

const override = (partName: string, type: string) => {
    return `<Override PartName="${partName}" ContentType="${CONTENT_TYPES}.${type}"/>`;
};

const relationship = (id: string, type: string, target: string) => {
    return `<Relationship Id="${id}" Type="${RELATIONSHIP_TYPES}/${type}" Target="${target}"/>`;
};
