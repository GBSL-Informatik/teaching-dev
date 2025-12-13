import { ParserConfig, ParserMessage, ParserResult, RasterParserInput } from '../types';
import {
    parseByteAscii,
    scaleByMaxValue,
    splitRasterData,
    validateMatchingNumberOfRasterBytes,
    validateMaxValue
} from './util';

export const parserP1Raster = ({ width, height, raster }: RasterParserInput): ParserResult => {
    const errors = [];
    const config: ParserConfig = { format: 'P1', width, height };

    try {
        const bits = splitRasterData(raster);
        const expectedNumberOfBits = width * height;

        if (bits.length === 0) {
            errors.push('Keine Rasterdaten gefunden.');
            return { errors: errors, config };
        }

        if (bits.length !== expectedNumberOfBits) {
            errors.push(
                `Bildgrösse ist ${width}x${height} (${expectedNumberOfBits} Bits), aber es wurden ${bits.length} Bits gefunden.`
            );
        }

        const pixels = new Uint8ClampedArray(width * height * 4);
        for (let row = 0; row < height; row++) {
            for (let col = 0; col < width; col++) {
                const bitAscii = bits[row * width + col];
                if (!bitAscii) {
                    continue;
                }

                const bitValue = parseByteAscii(bitAscii, errors);

                pixels[row * width * 4 + col * 4] = bitValue * 255; // red
                pixels[row * width * 4 + col * 4 + 1] = bitValue * 255; // green
                pixels[row * width * 4 + col * 4 + 2] = bitValue * 255; // blue
                pixels[row * width * 4 + col * 4 + 3] = 255; // alpha
            }
        }

        return {
            imageData: {
                pixels: pixels,
                width,
                height
            },
            config,
            errors: errors
        };
    } catch (e) {
        errors.push('Fehler beim Parsen der Bilddaten: ' + e);
        return { errors: errors, config };
    }
};

export const parseP2Raster = ({ width, height, maxValue, raster }: RasterParserInput): ParserResult => {
    const config: ParserConfig = { format: 'P2', width, height, maxValue: maxValue! };
    if (!maxValue) {
        return { errors: ['Maximalwert nicht angegeben oder 0'], config };
    }

    const errors: ParserMessage[] = [];

    try {
        const bytes = splitRasterData(raster);
        const expectedNumberOfBytes = width * height;

        if (bytes.length === 0) {
            errors.push('Keine Rasterdaten gefunden.');
            return { errors: errors, config };
        }

        validateMatchingNumberOfRasterBytes(bytes, expectedNumberOfBytes, width, height, errors);
        validateMaxValue(maxValue, errors);

        const pixels = new Uint8ClampedArray(width * height * 4);
        for (let row = 0; row < height; row++) {
            for (let col = 0; col < width; col++) {
                const byteAscii = bytes[row * width + col];
                if (!byteAscii) {
                    continue;
                }

                const byteValue = parseByteAscii(byteAscii, errors);

                const byteValueScaled = scaleByMaxValue(byteValue, maxValue);
                pixels[row * width * 4 + col * 4] = byteValueScaled; // red
                pixels[row * width * 4 + col * 4 + 1] = byteValueScaled; // green
                pixels[row * width * 4 + col * 4 + 2] = byteValueScaled; // blue
                pixels[row * width * 4 + col * 4 + 3] = 255; // alpha
            }
        }

        return {
            imageData: {
                pixels: pixels,
                width,
                height
            },
            config,
            errors: errors
        };
    } catch (e) {
        errors.push('Fehler beim Parsen der Bilddaten: ' + e);
        return { errors: errors, config };
    }
};

export const parseP3Raster = ({ width, height, maxValue, raster }: RasterParserInput): ParserResult => {
    const config: ParserConfig = { format: 'P3', width, height, maxValue: maxValue! };
    if (!maxValue) {
        return { errors: ['Maximalwert nicht angegeben oder 0'], config };
    }

    const errors: ParserMessage[] = [];

    try {
        const bytes = splitRasterData(raster);
        const expectedNumberOfBytes = width * height * 3;

        if (bytes.length === 0) {
            errors.push('Keine Rasterdaten gefunden.');
            return { errors: errors, config };
        }

        validateMatchingNumberOfRasterBytes(bytes, expectedNumberOfBytes, width, height, errors);
        validateMaxValue(maxValue, errors);

        const pixels = new Uint8ClampedArray(width * height * 4);
        for (let row = 0; row < height; row++) {
            for (let col = 0; col < width; col++) {
                for (let val = 0; val < 3; val++) {
                    const byteAscii = bytes[row * width * 3 + col * 3 + val];
                    if (!byteAscii) {
                        continue;
                    }

                    const byteValue = parseByteAscii(byteAscii, errors);

                    pixels[row * width * 4 + col * 4 + val] = scaleByMaxValue(byteValue, maxValue);
                    if (val === 2) {
                        pixels[row * width * 4 + col * 4 + 3] = 255; // alpha
                    }
                }
            }
        }

        return {
            imageData: {
                pixels: pixels,
                width,
                height
            },
            config,
            errors: errors
        };
    } catch (e) {
        errors.push('Fehler beim Parsen der Bilddaten: ' + e);
        return { errors: errors, config };
    }
};
