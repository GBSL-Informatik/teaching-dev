import { describe, expect, it } from 'vitest';
import OneEuroFilter from './OneEuroFilter';

describe('One Euro distance filter', () => {
    it('has no value before detection and holds the exact last output through missing targets', () => {
        const filter = new OneEuroFilter();
        expect(filter.update(null, 0)).toBeNull();
        expect(filter.update(2, 100)).toBe(2);
        const last = filter.update(2.1, 200);
        for (const timestamp of [300, 1000, 5000]) {
            expect(filter.update(null, timestamp)).toBe(last);
        }
    });
    it('does not feed held values into the filter and uses the interval between actual measurements', () => {
        const filter = new OneEuroFilter();
        const reference = new OneEuroFilter();
        for (const instance of [filter, reference]) {
            instance.update(2, 0);
            instance.update(2.1, 100);
        }
        for (let timestamp = 200; timestamp < 2500; timestamp += 100) filter.update(null, timestamp);
        expect(filter.update(3, 2500)).toBe(reference.update(3, 2500));
        expect(filter.update(3.1, 2600)).toBe(reference.update(3.1, 2600));
    });
    it('keeps the latest reading during missing detection when small changes continue either direction', () => {
        for (const readings of [
            [2, 2.1, 2.2],
            [2.2, 2.1, 2]
        ]) {
            const filter = new OneEuroFilter();
            const values = readings.map((distance, index) => filter.update(distance, index * 100)!);
            expect(filter.update(null, 300)).toBe(values[2]);
            expect(filter.update(null, 5000)).toBe(values[2]);
        }
    });
    it('holds the median when the last reading reverses the preceding direction even below 15 percent', () => {
        for (const readings of [
            [2, 2.1, 1.9],
            [2.1, 2, 2.2]
        ]) {
            const filter = new OneEuroFilter();
            const values = readings.map((distance, index) => filter.update(distance, index * 100)!);
            expect(Math.abs(values[2] - values[1]) / values[1]).toBeLessThan(0.15);
            const median = [...values].sort((a, b) => a - b)[1];
            expect(filter.update(null, 300)).toBe(median);
            expect(filter.update(null, 5000)).toBe(median);
            expect(median).not.toBe(values[2]);
        }
    });
    it('holds the median for a large final change even when its direction is consistent', () => {
        const filter = new OneEuroFilter();
        const values = [2, 2.1, 8].map((distance, index) => filter.update(distance, index * 100)!);
        expect((values[2] - values[1]) / values[1]).toBeGreaterThan(0.15);
        expect(filter.update(null, 300)).toBe(values[1]);
        expect(filter.update(null, 1000)).toBe(values[1]);
        // A held median never becomes a synthetic sample in the live filter.
        const reference = new OneEuroFilter();
        [2, 2.1, 8].forEach((distance, index) => reference.update(distance, index * 100));
        expect(filter.update(3, 1100)).toBe(reference.update(3, 1100));
    });
    it('handles stationary zero distances, duplicate timestamps and clears the window on restart', () => {
        const filter = new OneEuroFilter();
        [0, 0, 0].forEach((distance, index) => filter.update(distance, index * 100));
        expect(filter.update(null, 300)).toBe(0);
        filter.reset();
        const values = [2, 2.1, 8].map((distance, index) => filter.update(distance, index * 100)!);
        filter.update(1, 200);
        expect(filter.update(null, 300)).toBe(values[1]);
        expect(filter.update(4, 0)).toBe(4);
        expect(filter.update(null, 100)).toBe(4);
        filter.reset();
        expect(filter.update(null, 200)).toBeNull();
    });
    it('reduces stationary measurement noise', () => {
        const filter = new OneEuroFilter();
        const results = Array.from({ length: 80 }, (_, index) =>
            filter.update(2 + (index % 2 ? 0.05 : -0.05), index * 100)!
        ).slice(20);
        const deviation = results.reduce((sum, distance) => sum + Math.abs(distance - 2), 0) / results.length;
        expect(deviation).toBeLessThan(0.04);
    });
    it('follows approaching and departing motion with little lag', () => {
        for (const speed of [-5, -1.4, 1.4, 5]) {
            const filter = new OneEuroFilter();
            const errors = Array.from({ length: 60 }, (_, index) => {
                const distance = 40 + speed * index * 0.1;
                return Math.abs(filter.update(distance, index * 100)! - distance);
            });
            expect(Math.max(...errors.slice(20))).toBeLessThan(0.08);
        }
    });
    it('ignores invalid inputs and duplicate timestamps, and restarts on rollback or reset', () => {
        const filter = new OneEuroFilter();
        filter.update(2, 1000);
        const last = filter.update(2.1, 1100);
        for (const value of [NaN, Infinity, -1]) expect(filter.update(value, 1200)).toBe(last);
        expect(filter.update(8, NaN)).toBe(last);
        expect(filter.update(8, 1100)).toBe(last);
        expect(filter.update(1, 0)).toBe(1);
        filter.reset();
        expect(filter.update(null, 100)).toBeNull();
        expect(filter.update(4, 200)).toBe(4);
    });
});
