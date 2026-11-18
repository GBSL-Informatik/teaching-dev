import { HeaderFooter, Paragraph, Section } from './DocModel';
import { isOn } from './formatting';
import { twipsToCm } from './units';
import { attr, childElement, childElements, XmlElement } from './xml';

type ReadPart = (relationshipId: string) => Paragraph[];

const REFERENCE_KINDS: { [tag: string]: HeaderFooter['kind'] } = {
    'w:headerReference': 'header',
    'w:footerReference': 'footer'
};

export const buildSections = (sectionProperties: XmlElement[], readPart: ReadPart): Section[] => {
    return sectionProperties.reduce<Section[]>((sections, sectPr, index) => {
        const previous = sections.at(-1);
        return [...sections, buildSection(sectPr, index, previous, readPart)];
    }, []);
};

const buildSection = (
    sectPr: XmlElement,
    index: number,
    previous: Section | undefined,
    readPart: ReadPart
): Section => {
    const pageSize = childElement(sectPr, 'w:pgSz');
    const margins = childElement(sectPr, 'w:pgMar');
    const columns = childElement(sectPr, 'w:cols');
    const pageNumbers = childElement(sectPr, 'w:pgNumType');
    const pageNumberStart = attr(pageNumbers, 'w:start');
    const titlePage = childElement(sectPr, 'w:titlePg');

    return {
        index,
        breakType: attr(childElement(sectPr, 'w:type'), 'w:val') ?? 'nextPage',
        orientation: attr(pageSize, 'w:orient') === 'landscape' ? 'landscape' : 'portrait',
        marginsCm: {
            top: twipsToCm(attr(margins, 'w:top') ?? 0),
            right: twipsToCm(attr(margins, 'w:right') ?? 0),
            bottom: twipsToCm(attr(margins, 'w:bottom') ?? 0),
            left: twipsToCm(attr(margins, 'w:left') ?? 0)
        },
        columns: columnsOf(columns),
        pageNumberFormat: attr(pageNumbers, 'w:fmt') ?? 'decimal',
        pageNumberStart: pageNumberStart !== undefined ? Number(pageNumberStart) : undefined,
        titlePage: !!titlePage && isOn(attr(titlePage, 'w:val') ?? 'true'),
        headersAndFooters: headersAndFootersOf(sectPr, previous, readPart)
    };
};

const columnsOf = (cols: XmlElement | undefined): Section['columns'] => {
    const count = Number(attr(cols, 'w:num') ?? 1);
    // Word keeps a spacing for single column sections too, where it has no effect.
    const spacingCm = count > 1 ? twipsToCm(attr(cols, 'w:space') ?? 720) : 0;
    return { count, spacingCm, separator: isOn(attr(cols, 'w:sep')) };
};

/** A section without its own header or footer of a kind and variant inherits the previous section's. */
const headersAndFootersOf = (
    sectPr: XmlElement,
    previous: Section | undefined,
    readPart: ReadPart
): HeaderFooter[] => {
    const own = childElements(sectPr)
        .filter((child) => REFERENCE_KINDS[child.tag])
        .map((reference) => ({
            kind: REFERENCE_KINDS[reference.tag],
            variant: attr(reference, 'w:type') ?? 'default',
            paragraphs: readPart(attr(reference, 'r:id') ?? '')
        }));
    const inherited = (previous?.headersAndFooters ?? []).filter(
        (parent) => !own.some((child) => child.kind === parent.kind && child.variant === parent.variant)
    );
    return [...own, ...inherited];
};
