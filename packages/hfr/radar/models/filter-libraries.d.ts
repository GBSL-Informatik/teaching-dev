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

declare module 'kalman-filter' {
    export interface KalmanState {
        mean: number[][];
        covariance: number[][];
    }
    export class KalmanFilter {
        constructor(options: {
            observation: { dimension: number; stateProjection: number[][]; covariance: number[][] };
            dynamic: {
                dimension: number;
                transition: () => number[][];
                covariance: () => number[][];
                init: KalmanState;
            };
        });
        getInitState(): KalmanState;
        filter(options: { previousCorrected: KalmanState; observation: number[] }): KalmanState;
    }
}
