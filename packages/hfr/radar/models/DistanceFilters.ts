import oneEuro, { type OneEuroParameters } from 'digital-filter/smooth/one-euro.js';
import { KalmanFilter, type KalmanState } from 'kalman-filter';

export interface DistanceRecord {
    timestamp: number;
    selected: number | null;
    legacy: number | null;
    oneEuro: number | null;
    kalman: number | null;
}

// Starting parameters for comparison; tune against recorded hardware measurements.
export const DISTANCE_FILTER_SETTINGS = {
    oneEuro: { minCutoff: 1, beta: 4, dCutoff: 1 },
    kalman: { distanceStdDev: 0.05, accelerationStdDev: 2 }
};

export default class DistanceFilters {
    private previous?: DistanceRecord;
    private euro?: OneEuroParameters;
    private kalman?: KalmanFilter;
    private state?: KalmanState;
    private elapsed = 0;

    reset(): void {
        this.previous = undefined;
        this.euro = undefined;
        this.kalman = undefined;
        this.state = undefined;
    }

    update(selected: number | null, timestamp: number, reacquired = false): DistanceRecord {
        if (selected === null) {
            return { timestamp, selected, legacy: null, oneEuro: null, kalman: null };
        }
        const previous = this.previous;
        this.elapsed = previous ? (timestamp - previous.timestamp) / 1000 : 0;
        if (reacquired || !previous || this.elapsed < 0 || this.elapsed > 1) {
            this.euro = { ...DISTANCE_FILTER_SETTINGS.oneEuro, fs: 1, x: selected, xr: selected, dx: 0 };
            const variance = DISTANCE_FILTER_SETTINGS.kalman.distanceStdDev ** 2;
            this.kalman = new KalmanFilter({
                observation: { dimension: 1, stateProjection: [[1, 0]], covariance: [[variance]] },
                dynamic: {
                    dimension: 2,
                    transition: () => [
                        [1, this.elapsed],
                        [0, 1]
                    ],
                    covariance: () => {
                        const dt = this.elapsed;
                        const q = DISTANCE_FILTER_SETTINGS.kalman.accelerationStdDev ** 2;
                        return [
                            [(q * dt ** 4) / 4, (q * dt ** 3) / 2],
                            [(q * dt ** 3) / 2, q * dt ** 2]
                        ];
                    },
                    init: {
                        mean: [[selected], [0]],
                        covariance: [
                            [variance, 0],
                            [0, 4]
                        ]
                    }
                }
            });
            this.state = this.kalman.getInitState();
            this.previous = { timestamp, selected, legacy: selected, oneEuro: selected, kalman: selected };
            return this.previous;
        }
        // Repeated timestamps carry no elapsed motion; do not invent a sampling interval.
        if (this.elapsed === 0) {
            return { ...previous, timestamp, selected };
        }
        this.euro!.fs = 1 / this.elapsed;
        const euro = oneEuro(new Float64Array([selected]), this.euro!)[0];
        this.state = this.kalman!.filter({ previousCorrected: this.state!, observation: [selected] });
        const weight = 1 - Math.exp(-this.elapsed / 0.15);
        this.previous = {
            timestamp,
            selected,
            legacy: previous.legacy! + weight * (selected - previous.legacy!),
            oneEuro: Math.max(0, euro),
            kalman: Math.max(0, this.state.mean[0][0])
        };
        return this.previous;
    }
}
