import { Section } from '../docx/DocModel';
import { ThemeFonts } from '../docx/formatting';
import { parseStyleSheet, StyleSheet } from '../docx/styleSheet';
import { parseXml } from '../docx/xml';

/**
 * Style definitions of a blank document created from Word's Normal.dotm (Word 2013 and later),
 * derived from Word's built-in defaults. Formatting that equals these values is not graded.
 */
export const WORD_DEFAULT_STYLES_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
    <w:docDefaults>
        <w:rPrDefault><w:rPr><w:rFonts w:asciiTheme="minorHAnsi" w:eastAsiaTheme="minorHAnsi" w:hAnsiTheme="minorHAnsi" w:cstheme="minorBidi"/><w:sz w:val="22"/><w:szCs w:val="22"/><w:lang w:val="de-CH" w:eastAsia="en-US" w:bidi="ar-SA"/></w:rPr></w:rPrDefault>
        <w:pPrDefault><w:pPr><w:spacing w:after="160" w:line="259" w:lineRule="auto"/></w:pPr></w:pPrDefault>
    </w:docDefaults>
    <w:style w:type="paragraph" w:default="1" w:styleId="Standard"><w:name w:val="Normal"/><w:qFormat/></w:style>
    <w:style w:type="paragraph" w:styleId="berschrift1"><w:name w:val="heading 1"/><w:basedOn w:val="Standard"/><w:next w:val="Standard"/><w:uiPriority w:val="9"/><w:qFormat/><w:pPr><w:keepNext/><w:keepLines/><w:spacing w:before="240" w:after="0"/><w:outlineLvl w:val="0"/></w:pPr><w:rPr><w:rFonts w:asciiTheme="majorHAnsi" w:eastAsiaTheme="majorEastAsia" w:hAnsiTheme="majorHAnsi" w:cstheme="majorBidi"/><w:color w:val="2F5496" w:themeColor="accent1" w:themeShade="BF"/><w:sz w:val="32"/><w:szCs w:val="32"/></w:rPr></w:style>
    <w:style w:type="paragraph" w:styleId="berschrift2"><w:name w:val="heading 2"/><w:basedOn w:val="Standard"/><w:next w:val="Standard"/><w:uiPriority w:val="9"/><w:unhideWhenUsed/><w:qFormat/><w:pPr><w:keepNext/><w:keepLines/><w:spacing w:before="40" w:after="0"/><w:outlineLvl w:val="1"/></w:pPr><w:rPr><w:rFonts w:asciiTheme="majorHAnsi" w:eastAsiaTheme="majorEastAsia" w:hAnsiTheme="majorHAnsi" w:cstheme="majorBidi"/><w:color w:val="2F5496" w:themeColor="accent1" w:themeShade="BF"/><w:sz w:val="26"/><w:szCs w:val="26"/></w:rPr></w:style>
    <w:style w:type="paragraph" w:styleId="berschrift3"><w:name w:val="heading 3"/><w:basedOn w:val="Standard"/><w:next w:val="Standard"/><w:uiPriority w:val="9"/><w:unhideWhenUsed/><w:qFormat/><w:pPr><w:keepNext/><w:keepLines/><w:spacing w:before="40" w:after="0"/><w:outlineLvl w:val="2"/></w:pPr><w:rPr><w:rFonts w:asciiTheme="majorHAnsi" w:eastAsiaTheme="majorEastAsia" w:hAnsiTheme="majorHAnsi" w:cstheme="majorBidi"/><w:color w:val="1F3763" w:themeColor="accent1" w:themeShade="7F"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr></w:style>
    <w:style w:type="paragraph" w:styleId="berschrift4"><w:name w:val="heading 4"/><w:basedOn w:val="Standard"/><w:next w:val="Standard"/><w:uiPriority w:val="9"/><w:unhideWhenUsed/><w:qFormat/><w:pPr><w:keepNext/><w:keepLines/><w:spacing w:before="40" w:after="0"/><w:outlineLvl w:val="3"/></w:pPr><w:rPr><w:rFonts w:asciiTheme="majorHAnsi" w:eastAsiaTheme="majorEastAsia" w:hAnsiTheme="majorHAnsi" w:cstheme="majorBidi"/><w:i/><w:iCs/><w:color w:val="2F5496" w:themeColor="accent1" w:themeShade="BF"/></w:rPr></w:style>
    <w:style w:type="paragraph" w:styleId="Titel"><w:name w:val="Title"/><w:basedOn w:val="Standard"/><w:next w:val="Standard"/><w:uiPriority w:val="10"/><w:qFormat/><w:pPr><w:spacing w:after="0" w:line="240" w:lineRule="auto"/><w:contextualSpacing/></w:pPr><w:rPr><w:rFonts w:asciiTheme="majorHAnsi" w:eastAsiaTheme="majorEastAsia" w:hAnsiTheme="majorHAnsi" w:cstheme="majorBidi"/><w:spacing w:val="-10"/><w:kern w:val="28"/><w:sz w:val="56"/><w:szCs w:val="56"/></w:rPr></w:style>
    <w:style w:type="paragraph" w:styleId="Untertitel"><w:name w:val="Subtitle"/><w:basedOn w:val="Standard"/><w:next w:val="Standard"/><w:uiPriority w:val="11"/><w:qFormat/><w:pPr><w:numPr><w:ilvl w:val="1"/></w:numPr></w:pPr><w:rPr><w:rFonts w:eastAsiaTheme="minorEastAsia"/><w:color w:val="5A5A5A" w:themeColor="text1" w:themeTint="A5"/><w:spacing w:val="15"/></w:rPr></w:style>
    <w:style w:type="paragraph" w:styleId="Beschriftung"><w:name w:val="caption"/><w:basedOn w:val="Standard"/><w:next w:val="Standard"/><w:uiPriority w:val="35"/><w:unhideWhenUsed/><w:qFormat/><w:pPr><w:spacing w:after="200" w:line="240" w:lineRule="auto"/></w:pPr><w:rPr><w:i/><w:iCs/><w:color w:val="44546A" w:themeColor="text2"/><w:sz w:val="18"/><w:szCs w:val="18"/></w:rPr></w:style>
    <w:style w:type="paragraph" w:styleId="Listenabsatz"><w:name w:val="List Paragraph"/><w:basedOn w:val="Standard"/><w:uiPriority w:val="34"/><w:qFormat/><w:pPr><w:ind w:left="720"/><w:contextualSpacing/></w:pPr></w:style>
    <w:style w:type="paragraph" w:styleId="KeinLeerraum"><w:name w:val="No Spacing"/><w:uiPriority w:val="1"/><w:qFormat/><w:pPr><w:spacing w:after="0" w:line="240" w:lineRule="auto"/></w:pPr></w:style>
    <w:style w:type="paragraph" w:styleId="Verzeichnis1"><w:name w:val="toc 1"/><w:basedOn w:val="Standard"/><w:next w:val="Standard"/><w:uiPriority w:val="39"/><w:unhideWhenUsed/><w:pPr><w:spacing w:after="100"/></w:pPr></w:style>
    <w:style w:type="paragraph" w:styleId="Verzeichnis2"><w:name w:val="toc 2"/><w:basedOn w:val="Standard"/><w:next w:val="Standard"/><w:uiPriority w:val="39"/><w:unhideWhenUsed/><w:pPr><w:spacing w:after="100"/><w:ind w:left="220"/></w:pPr></w:style>
    <w:style w:type="paragraph" w:styleId="Verzeichnis3"><w:name w:val="toc 3"/><w:basedOn w:val="Standard"/><w:next w:val="Standard"/><w:uiPriority w:val="39"/><w:unhideWhenUsed/><w:pPr><w:spacing w:after="100"/><w:ind w:left="440"/></w:pPr></w:style>
    <w:style w:type="paragraph" w:styleId="Abbildungsverzeichnis"><w:name w:val="table of figures"/><w:basedOn w:val="Standard"/><w:next w:val="Standard"/><w:uiPriority w:val="99"/><w:unhideWhenUsed/><w:pPr><w:spacing w:after="0"/></w:pPr></w:style>
    <w:style w:type="paragraph" w:styleId="Literaturverzeichnis"><w:name w:val="Bibliography"/><w:basedOn w:val="Standard"/><w:next w:val="Standard"/><w:uiPriority w:val="37"/><w:unhideWhenUsed/></w:style>
    <w:style w:type="paragraph" w:styleId="Kopfzeile"><w:name w:val="header"/><w:basedOn w:val="Standard"/><w:uiPriority w:val="99"/><w:unhideWhenUsed/><w:pPr><w:tabs><w:tab w:val="center" w:pos="4536"/><w:tab w:val="right" w:pos="9072"/></w:tabs><w:spacing w:after="0" w:line="240" w:lineRule="auto"/></w:pPr></w:style>
    <w:style w:type="paragraph" w:styleId="Fuzeile"><w:name w:val="footer"/><w:basedOn w:val="Standard"/><w:uiPriority w:val="99"/><w:unhideWhenUsed/><w:pPr><w:tabs><w:tab w:val="center" w:pos="4536"/><w:tab w:val="right" w:pos="9072"/></w:tabs><w:spacing w:after="0" w:line="240" w:lineRule="auto"/></w:pPr></w:style>
    <w:style w:type="paragraph" w:styleId="Funotentext"><w:name w:val="footnote text"/><w:basedOn w:val="Standard"/><w:uiPriority w:val="99"/><w:semiHidden/><w:unhideWhenUsed/><w:pPr><w:spacing w:after="0" w:line="240" w:lineRule="auto"/></w:pPr><w:rPr><w:sz w:val="20"/><w:szCs w:val="20"/></w:rPr></w:style>
    <w:style w:type="character" w:default="1" w:styleId="Absatz-Standardschriftart"><w:name w:val="Default Paragraph Font"/><w:uiPriority w:val="1"/><w:semiHidden/><w:unhideWhenUsed/></w:style>
    <w:style w:type="character" w:styleId="Hyperlink"><w:name w:val="Hyperlink"/><w:basedOn w:val="Absatz-Standardschriftart"/><w:uiPriority w:val="99"/><w:unhideWhenUsed/><w:rPr><w:color w:val="0563C1" w:themeColor="hyperlink"/><w:u w:val="single"/></w:rPr></w:style>
    <w:style w:type="character" w:styleId="Funotenzeichen"><w:name w:val="footnote reference"/><w:basedOn w:val="Absatz-Standardschriftart"/><w:uiPriority w:val="99"/><w:semiHidden/><w:unhideWhenUsed/><w:rPr><w:vertAlign w:val="superscript"/></w:rPr></w:style>
    <w:style w:type="table" w:default="1" w:styleId="NormaleTabelle"><w:name w:val="Normal Table"/><w:uiPriority w:val="99"/><w:semiHidden/><w:unhideWhenUsed/><w:tblPr><w:tblInd w:w="0" w:type="dxa"/><w:tblCellMar><w:top w:w="0" w:type="dxa"/><w:left w:w="108" w:type="dxa"/><w:bottom w:w="0" w:type="dxa"/><w:right w:w="108" w:type="dxa"/></w:tblCellMar></w:tblPr></w:style>
    <w:style w:type="numbering" w:default="1" w:styleId="KeineListe"><w:name w:val="No List"/><w:uiPriority w:val="99"/><w:semiHidden/><w:unhideWhenUsed/></w:style>
</w:styles>`;

/** Page setup of a blank A4 document (Word, German locale). */
export const WORD_DEFAULT_SECTION: Omit<Section, 'index' | 'headersAndFooters'> = {
    breakType: 'nextPage',
    orientation: 'portrait',
    marginsCm: { top: 2.5, right: 2.5, bottom: 2, left: 2.5 },
    columns: { count: 1, spacingCm: 0, separator: false },
    pageNumberFormat: 'decimal',
    pageNumberStart: undefined,
    titlePage: false
};

/** The default styles, with theme fonts taken from the graded document's own theme. */
export const createWordDefaultStyleSheet = (themeFonts: ThemeFonts): StyleSheet => {
    return parseStyleSheet(parseXml(WORD_DEFAULT_STYLES_XML), undefined, themeFonts);
};
