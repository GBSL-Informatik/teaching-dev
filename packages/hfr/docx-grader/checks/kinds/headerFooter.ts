import { DocModel, HeaderFooter, Section } from '../../docx/DocModel';
import { Alignment } from '../../docx/formatting';
import { quote } from '../anchors';
import { CheckBase, CheckKind, ParagraphAnchor } from '../Check';
import { Normalizer } from '../normalizeText';
import { PARAGRAPH_PROPERTIES } from '../properties';
import { evaluateAnchors, groupBy, sectionAnchor } from './helpers';

/** The sections containing the anchored paragraphs have the original's header or footer. */
export interface HeaderFooterCheck extends CheckBase<'headerFooter'> {
    anchors: ParagraphAnchor[];
    expect: {
        kind: HeaderFooter['kind'];
        /** `default`, `first` (first page of the section) or `even` (even pages) */
        variant: string;
        /** Text without field results such as the page number. */
        text: string;
        pageNumber: boolean;
        alignment: Alignment;
    };
}

const KIND_LABELS = { header: 'Kopfzeile', footer: 'Fusszeile' };
const VARIANT_LABELS: { [variant: string]: string } = {
    default: '',
    first: ' der ersten Seite',
    even: ' der geraden Seiten'
};

export const headerFooter: CheckKind<HeaderFooterCheck> = {
    category: 'Kopf- und Fusszeilen',

    extract: (context) => {
        const { original, normalize } = context;
        const expectations = original.sections.flatMap((sectionOfOriginal) => {
            const anchor = sectionAnchor(context, sectionOfOriginal.index);
            if (!anchor) {
                return [];
            }
            return visibleHeadersAndFooters(sectionOfOriginal, original)
                .map((part) => expectationOf(part, normalize))
                .filter((expect) => expect.text || expect.pageNumber)
                .map((expect) => ({ anchor, expect }));
        });

        return groupBy(expectations, ({ expect }) => JSON.stringify(expect)).map((group) => {
            const { expect } = group[0];
            return {
                kind: 'headerFooter',
                title: describe(expect),
                anchors: group.map(({ anchor }) => anchor),
                expect
            };
        });
    },

    evaluate: (check, context) => {
        const { kind, variant } = check.expect;
        return evaluateAnchors(check.anchors, context, (paragraph) => {
            const sectionOfStudent = context.document.sections[paragraph.sectionIndex];
            const part = visibleHeadersAndFooters(sectionOfStudent, context.document).find(
                (candidate) => candidate.kind === kind && candidate.variant === variant
            );
            if (!part) {
                return [`${KIND_LABELS[kind]}${VARIANT_LABELS[variant]} fehlt`];
            }
            return mismatchesOf(check.expect, expectationOf(part, context.normalize));
        });
    }
};

/** First page and even page variants are only shown when the section or document enables them. */
const visibleHeadersAndFooters = (section: Section, document: DocModel): HeaderFooter[] => {
    return section.headersAndFooters.filter(
        ({ variant }) =>
            variant === 'default' ||
            (variant === 'first' && section.titlePage) ||
            (variant === 'even' && document.evenAndOddHeaders)
    );
};

const expectationOf = (part: HeaderFooter, normalize: Normalizer): HeaderFooterCheck['expect'] => {
    const authoredText = part.paragraphs
        .map((paragraph) =>
            paragraph.runs
                .filter((run) => !run.field)
                .map((run) => run.text)
                .join('')
        )
        .join(' ');
    const pageNumber = part.paragraphs.some((paragraph) =>
        paragraph.fields.some((field) => field.type === 'pageNumber')
    );
    const contentParagraph = part.paragraphs.find((paragraph) => paragraph.text.trim()) ?? part.paragraphs[0];
    return {
        kind: part.kind,
        variant: part.variant,
        text: normalize(authoredText),
        pageNumber,
        alignment: contentParagraph?.format.alignment ?? 'left'
    };
};

const mismatchesOf = (expect: HeaderFooterCheck['expect'], actual: HeaderFooterCheck['expect']) => {
    const failures: string[] = [];
    if (actual.text !== expect.text) {
        failures.push(`Text ${quote(actual.text)} statt ${quote(expect.text)}`);
    }
    if (actual.pageNumber !== expect.pageNumber) {
        failures.push(expect.pageNumber ? 'Seitenzahl fehlt' : 'Seitenzahl ist zu viel');
    }
    if (actual.alignment !== expect.alignment) {
        const { format } = PARAGRAPH_PROPERTIES.alignment;
        failures.push(`Ausrichtung: ${format(actual.alignment)} statt ${format(expect.alignment)}`);
    }
    return failures;
};

const describe = (expect: HeaderFooterCheck['expect']) => {
    const parts = [
        expect.text && quote(expect.text),
        expect.pageNumber && 'mit Seitenzahl',
        PARAGRAPH_PROPERTIES.alignment.format(expect.alignment)
    ].filter(Boolean);
    return `${KIND_LABELS[expect.kind]}${VARIANT_LABELS[expect.variant]}: ${parts.join(', ')}`;
};
