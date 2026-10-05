declare module 'digital-filter/smooth/one-euro.js' {
    export interface OneEuroParameters {
        minCutoff: number;
        beta: number;
        dCutoff: number;
        fs: number;
        x?: number;
        xr?: number;
        dx?: number;
    }
    export default function oneEuro(data: Float64Array, params: OneEuroParameters): Float64Array;
}
