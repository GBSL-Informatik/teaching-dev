import oneEuro, { type OneEuroParameters } from 'digital-filter/smooth/one-euro.js';

export const ONE_EURO_SETTINGS = { minCutoff: 1, beta: 4, dCutoff: 1 };

export default class OneEuroFilter {
    private parameters?: OneEuroParameters;
    private timestamp?: number;

    reset(): void {
        this.parameters = undefined;
        this.timestamp = undefined;
    }

    update(distance: number | null, timestamp: number): number | null {
        // Missing targets hold the last output without advancing the filter's state or clock.
        if (distance === null || !Number.isFinite(distance) || distance < 0 || !Number.isFinite(timestamp)) {
            return this.parameters?.x ?? null;
        }
        if (!this.parameters || timestamp < this.timestamp!) {
            this.parameters = { ...ONE_EURO_SETTINGS, fs: 1, x: distance, xr: distance, dx: 0 };
            this.timestamp = timestamp;
            return distance;
        }
        // Duplicate timestamps provide no sampling interval.
        if (timestamp === this.timestamp) {
            return this.parameters.x!;
        }
        this.parameters.fs = 1000 / (timestamp - this.timestamp!);
        this.timestamp = timestamp;
        return oneEuro(new Float64Array([distance]), this.parameters)[0];
    }
}
