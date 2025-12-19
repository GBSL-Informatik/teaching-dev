import { ParserMessage, ParserResult, RasterParserInput } from '../types';
import { parseP2Raster, parseP3Raster, parserP1Raster } from './rasterParser';

export const SUPPORTED_FORMATS = ['P1', 'P2', 'P3'];

export const PATTERN_P1 = /(?<format>P1)\s+(?<width>\d+)\s+(?<height>\d+)\s+(?<raster>[\d\D\s]*)/;
export const PATTERN_P2 =
    /(?<format>P2)\s+(?<width>\d+)\s+(?<height>\d+)\s+(?<max>\d+)\s+(?<raster>[\d\D\s]*)/;
export const PATTERN_P3 =
    /(?<format>P3)\s+(?<width>\d+)\s+(?<height>\d+)\s+(?<max>\d+)\s+(?<raster>[\d\D\s]*)/;

const DATA_PARSERS: { [key: string]: (input: RasterParserInput) => ParserResult } = {
    P1: parserP1Raster,
    P2: parseP2Raster,
    P3: parseP3Raster
};

// TODO: We could technically have a single-line PBM, so the line-based checks may not be reliable.
function createErrorReport(sanitizedData: string): ParserMessage[] {
    const errors: ParserMessage[] = [];

    if (!sanitizedData) {
        return errors;
    }

    const lines = sanitizedData.split('\n');
    if (!SUPPORTED_FORMATS.includes(lines[0].trim())) {
        errors.push(
            <span>
                Unbekanntes Format auf der ersten Zeile: <code>{lines[0].trim()}</code>. Unterstützte Formate:{' '}
                <code>{SUPPORTED_FORMATS.join(', ')}</code>.
            </span>
        );
    }

    const dimensionLinePattern = /^\s*\d+\s+\d+\s*$/;
    const dimensionLineMatch = dimensionLinePattern.exec(lines[1]);
    if (!dimensionLineMatch) {
        errors.push(
            <span>
                Auf der zweiten Zeile werden die Dimensionen des Bildes im Format <code>BREITE HÖHE</code>{' '}
                (z.B. <code>10 6</code>) erwartet.
            </span>
        );
    }

    // Catch-all, in case we aren't able to identify the specific error.
    if (errors.length === 0) {
        errors.push('Ungültiges Datenformat.');
    }

    return errors;
}

export const parse = (sanitizedData: string): ParserResult => {
    const matchP1 = PATTERN_P1.exec(sanitizedData);
    const matchP2 = PATTERN_P2.exec(sanitizedData);
    const matchP3 = PATTERN_P3.exec(sanitizedData);

    const match = [matchP1, matchP2, matchP3].find((m) => m !== null);

    if (!match) {
        const errors = createErrorReport(sanitizedData);
        return { errors: errors, config: { format: 'P1', width: 0, height: 0 } };
    }

    if (!match.groups) {
        return {
            errors: ['Unerwarteter Fehler beim Parsen der Bilddaten: Keine Gruppen im regulären Ausdruck.'],
            config: { format: 'P1', width: 0, height: 0 }
        };
    }

    const rasterParserInput: RasterParserInput = {
        format: match.groups.format as 'P1' | 'P2' | 'P3',
        width: parseInt(match.groups.width),
        height: parseInt(match.groups.height),
        maxValue: match.groups.max ? parseInt(match.groups.max) : undefined,
        raster: match.groups.raster
    };

    return DATA_PARSERS[rasterParserInput.format](rasterParserInput);
};
