import { Caption, Image } from '../../docx/DocModel';
import { quote } from '../anchors';
import { CheckBase, CheckKind } from '../Check';
import { Normalizer } from '../normalizeText';
import { lookup } from '../properties';

const CAPTION_LENGTH = 60;
// Images are resized by dragging, so their size is never exact.
const WIDTH_TOLERANCE_CM = 0.3;

/** Images are anchored by their position, as the raw document contains them in the same order. */
export interface ImageAnchor {
    image: number;
}

/** An image has the original's size, text wrapping and caption; its exact position is free. */
export interface ImageCheck extends CheckBase<'image'> {
    anchors: ImageAnchor[];
    expect: {
        widthCm: number;
        placement: Image['placement'];
        wrap?: string;
        caption?: {
            /** Set when the caption was inserted with Word's caption function, e.g. `Abbildung`. */
            label?: string;
            /** Start of the normalized description. */
            text: string;
        };
    };
}

const formatPlacement = lookup({ inline: 'mit Text in Zeile', anchored: 'mit Textumbruch' });
const formatWrap = lookup({
    square: 'Quadrat',
    tight: 'Passend',
    through: 'Transparent',
    topAndBottom: 'Oben und unten',
    behindText: 'Hinter den Text',
    inFrontOfText: 'Vor den Text'
});

export const image: CheckKind<ImageCheck> = {
    category: 'Bilder und Beschriftungen',

    extract: ({ original, normalize }) => {
        return original.images.map((imageOfOriginal) => {
            const caption = imageOfOriginal.caption;
            return {
                kind: 'image',
                title: `Bild ${imageOfOriginal.index + 1}${caption ? ` ${quote(caption.description)}` : ''}`,
                anchors: [{ image: imageOfOriginal.index }],
                expect: {
                    widthCm: imageOfOriginal.widthCm,
                    placement: imageOfOriginal.placement,
                    ...(imageOfOriginal.wrap ? { wrap: imageOfOriginal.wrap } : {}),
                    ...(caption ? { caption: captionExpectation(caption, normalize) } : {})
                }
            };
        });
    },

    evaluate: (check, context) => {
        return check.anchors.flatMap((anchor) => {
            const actual = context.document.images[anchor.image];
            if (!actual) {
                return [`Bild ${anchor.image + 1} nicht gefunden`];
            }
            return [
                ...layoutMismatches(check.expect, actual),
                ...captionMismatches(check.expect.caption, actual.caption, context.normalize)
            ].map((failure) => `Bild ${anchor.image + 1}: ${failure}`);
        });
    }
};

const captionExpectation = (caption: Caption, normalize: Normalizer) => {
    const text = normalize(caption.description).slice(0, CAPTION_LENGTH);
    return caption.label ? { label: caption.label, text } : { text };
};

const layoutMismatches = (expect: ImageCheck['expect'], actual: Image): string[] => {
    const failures: string[] = [];
    if (Math.abs(actual.widthCm - expect.widthCm) > WIDTH_TOLERANCE_CM) {
        failures.push(`Breite: ${actual.widthCm} cm statt ${expect.widthCm} cm`);
    }
    if (actual.placement !== expect.placement) {
        failures.push(
            `Layout: ${formatPlacement(actual.placement)} statt ${formatPlacement(expect.placement)}`
        );
    } else if (expect.wrap && actual.wrap !== expect.wrap) {
        failures.push(`Textumbruch: ${formatWrap(actual.wrap ?? '')} statt ${formatWrap(expect.wrap)}`);
    }
    return failures;
};

const captionMismatches = (
    expect: ImageCheck['expect']['caption'],
    actual: Caption | undefined,
    normalize: Normalizer
): string[] => {
    if (!expect) {
        return [];
    }
    if (!actual) {
        return ['Beschriftung fehlt oder ist nicht direkt beim Bild'];
    }
    const failures: string[] = [];
    const text = normalize(actual.description).slice(0, CAPTION_LENGTH);
    if (text !== expect.text) {
        failures.push(`Beschriftung ${quote(text)} statt ${quote(expect.text)}`);
    }
    if (expect.label && !actual.label) {
        failures.push('Beschriftung wurde nicht mit «Beschriftung einfügen» erstellt');
    } else if (expect.label && actual.label !== expect.label) {
        failures.push(`Bezeichnung «${actual.label}» statt «${expect.label}»`);
    }
    return failures;
};
