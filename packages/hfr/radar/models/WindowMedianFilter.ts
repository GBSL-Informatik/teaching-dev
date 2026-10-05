export default class WindowMedianFilter {
    private readings: number[] = [];
    private timestamp?: number;

    reset(): void {
        this.readings = [];
        this.timestamp = undefined;
    }

    update(distance: number | null, timestamp: number): number | null {
        if (distance !== null && Number.isFinite(distance) && distance >= 0 && Number.isFinite(timestamp)) {
            if (this.timestamp !== undefined && timestamp < this.timestamp) {
                this.reset();
            }
            if (timestamp !== this.timestamp) {
                this.readings.push(distance);
                this.readings = this.readings.slice(-3);
                this.timestamp = timestamp;
            }
        }
        const sorted = [...this.readings].sort((a, b) => a - b);
        if (!sorted.length) return null;
        const middle = Math.floor(sorted.length / 2);
        return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
    }
}
