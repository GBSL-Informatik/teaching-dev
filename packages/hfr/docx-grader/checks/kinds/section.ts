import { Section } from '../../docx/DocModel';
import { quote } from '../anchors';
import { CheckBase, CheckKind, ParagraphAnchor } from '../Check';
import {
    describeProperties,
    differences,
    lookup,
    mismatches,
    PropertyDescriptors,
    yesNo
} from '../properties';
import { evaluateAnchors, SECTION_NOT_FOUND, sectionAnchor } from './helpers';

type PageSetup = Omit<Section, 'index' | 'headersAndFooters'>;

/** The section containing the anchored paragraph has the page setup of the original's section. */
export interface SectionCheck extends CheckBase<'section'> {
    anchors: ParagraphAnchor[];
    expect: Partial<PageSetup>;
}

const SECTION_PROPERTIES: PropertyDescriptors<PageSetup> = {
    breakType: {
        label: 'Abschnittsumbruch',
        format: lookup({
            nextPage: 'nächste Seite',
            continuous: 'fortlaufend',
            evenPage: 'gerade Seite',
            oddPage: 'ungerade Seite',
            nextColumn: 'nächste Spalte'
        })
    },
    orientation: {
        label: 'Ausrichtung',
        format: lookup({ portrait: 'Hochformat', landscape: 'Querformat' })
    },
    marginsCm: {
        label: 'Seitenränder',
        format: (margins) =>
            `oben ${margins.top} cm, rechts ${margins.right} cm, unten ${margins.bottom} cm, links ${margins.left} cm`
    },
    columns: {
        label: 'Spalten',
        format: (columns) => {
            const spacing = columns.count > 1 ? `, Abstand ${columns.spacingCm} cm` : '';
            const separator = columns.separator ? ', mit Zwischenlinie' : '';
            return `${columns.count}${spacing}${separator}`;
        }
    },
    pageNumberFormat: {
        label: 'Seitenzahlenformat',
        format: lookup({
            decimal: '1, 2, 3',
            upperRoman: 'I, II, III',
            lowerRoman: 'i, ii, iii',
            upperLetter: 'A, B, C',
            lowerLetter: 'a, b, c'
        })
    },
    pageNumberStart: {
        label: 'Seitenzahlen',
        format: (start) => (start === undefined ? 'fortlaufend' : `beginnen bei ${start}`)
    },
    titlePage: { label: 'Erste Seite anders', format: yesNo }
};

export const section: CheckKind<SectionCheck> = {
    category: 'Abschnitte und Seitenlayout',
    anchors: 'paragraph',

    extract: (context) => {
        return context.original.sections.flatMap((sectionOfOriginal) => {
            const anchor = sectionAnchor(context, sectionOfOriginal.index);
            if (!anchor) {
                return [];
            }
            const expect = differences(
                pageSetupOf(sectionOfOriginal),
                context.baseline.section,
                SECTION_PROPERTIES
            );
            // How the first section starts has no effect.
            if (sectionOfOriginal.index === 0) {
                delete expect.breakType;
            }
            if (Object.keys(expect).length === 0) {
                return [];
            }
            return [
                {
                    kind: 'section',
                    title: `Abschnitt ab ${quote(anchor.text)}: ${describeProperties(expect, SECTION_PROPERTIES)}`,
                    anchors: [anchor],
                    expect
                }
            ];
        });
    },

    evaluate: (check, context) => {
        return evaluateAnchors(check.anchors, context, (paragraph) => {
            const actual = context.document.sections[paragraph.sectionIndex];
            if (!actual) {
                return [SECTION_NOT_FOUND];
            }
            return mismatches(check.expect, pageSetupOf(actual), SECTION_PROPERTIES);
        });
    }
};

const pageSetupOf = ({ index, headersAndFooters, ...pageSetup }: Section): PageSetup => {
    return pageSetup;
};
