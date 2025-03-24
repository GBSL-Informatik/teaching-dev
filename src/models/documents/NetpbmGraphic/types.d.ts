export interface ParserConfig {
    format: 'P1' | 'P2' | 'P3';
    width: number;
    height: number;
    maxValue?: number;
}

export interface RasterParserInput extends ParserConfig {
    raster: string;
}

export type ParserMessage = string | React.ReactElement;

export interface ParserImageDataResult {
    pixels: Uint8ClampedArray;
    width: number;
    height: number;
}

export interface ParserResult {
    imageData?: ParserImageDataResult;
    errors?: ParserMessage[];
    warnings?: ParserMessage[];
    config: ParserConfig;
}
