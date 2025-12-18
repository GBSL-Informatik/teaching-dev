import { ParserMessage } from '../types';

export const splitRasterData = (raster: string): string[] => {
    return raster.split(/\s+/);
};

export const validateMatchingNumberOfRasterBytes = (
    bytes: string[],
    expectedNumberOfBytes: number,
    width: number,
    height: number,
    errors: ParserMessage[]
) => {
    if (bytes.length !== expectedNumberOfBytes) {
        errors.push(
            `Bildgrösse ist ${width}x${height} (${expectedNumberOfBytes} Raster-Bytes), aber es wurden ${bytes.length} Raster-Bytes gefunden.`
        );
    }
};

export const validateMaxValue = (maxValue: number, errors: ParserMessage[]) => {
    if (maxValue < 1 || maxValue >= 65536) {
        errors.push(
            <span>
                Maximalwert <code>{maxValue}</code> ungültig. Der Wert muss grösser als 0 und kleiner als
                65536 sein.
            </span>
        );
    }
};

export const parseByteAscii = (byteAscii: string, errors: ParserMessage[]): number => {
    if (!byteAscii.match(/^\d+$/)) {
        errors.push(
            <span>
                Ungültiger Wert in den Rasterdaten: <code>{byteAscii}</code>.
            </span>
        );
        return 0;
    }
    return parseInt(byteAscii);
};

export const scaleByMaxValue = (value: number, maxValue: number): number => {
    return (value / maxValue) * 255;
};
