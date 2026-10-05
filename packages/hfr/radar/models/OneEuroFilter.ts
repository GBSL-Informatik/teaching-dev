import oneEuro, { type OneEuroParameters } from 'digital-filter/smooth/one-euro.js';

export const HOLD_MAX_RELATIVE_CHANGE = 0.15;

export const ONE_EURO_SETTINGS = { minCutoff: 1, beta: 4, dCutoff: 1 };

export default class OneEuroFilter {
    private parameters?: OneEuroParameters;
    private timestamp?: number;
    private readings: number[] = [];

    reset(): void {
        this.parameters = undefined;
        this.timestamp = undefined;
        this.readings = [];
    }

    update(distance: number | null, timestamp: number): number | null {
        // Missing targets use a robust held value without advancing the filter's state or clock.
        if (distance === null || !Number.isFinite(distance) || distance < 0 || !Number.isFinite(timestamp)) {
            return this.getHeldDistance();
        }
        if (!this.parameters || timestamp < this.timestamp!) {
            this.reset();
            this.readings.push(distance);
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
        const filtered = oneEuro(new Float64Array([distance]), this.parameters)[0];
        this.readings.push(filtered);
        this.readings = this.readings.slice(-3);
        return filtered;
    }

    private getHeldDistance(): number | null {
        if (this.readings.length < 3) {
            // A direction cannot be established until three detected readings are available.
            return this.readings.at(-1) ?? null;
        }
        const [earlier, previous, latest] = this.readings;
        const priorChange = previous - earlier;
        const change = latest - previous;
        const smallChange = change === 0 || Math.abs(change) < Math.abs(previous) * HOLD_MAX_RELATIVE_CHANGE;
        // A zero change is compatible with stopping; a flat preceding pair has no established direction.
        const consistentDirection = priorChange * change >= 0;
        if (smallChange && consistentDirection) {
            return latest;
        }
        return [...this.readings].sort((a, b) => a - b)[1];
    }
}
