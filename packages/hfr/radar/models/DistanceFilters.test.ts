import { describe, expect, it } from 'vitest';
import DistanceFilters, { type DistanceRecord } from './DistanceFilters';

const keys = ['legacy', 'oneEuro', 'kalman'] as const;

describe('Distance filter comparison', () => {
    it('follows an approaching and departing walking or running person without exceeding 20 km/h', () => {
        for (const speed of [-5, -1.4, 1.4, 5]) {
            const filters = new DistanceFilters();
            const results = Array.from({ length: 60 }, (_, index) => {
                const distance = 40 + speed * index * 0.1;
                const record = filters.update(distance, index * 100);
                expect(Math.abs(filters.estimatedSpeedKmh!)).toBeLessThanOrEqual(20);
                return Math.abs(record.kalman! - distance);
            });
            expect(Math.max(...results.slice(20))).toBeLessThan(0.08);
        }
    });
    it('bounds the Kalman motion estimate even when presented with excessive apparent speed', () => {
        for (const speed of [-10, 10]) {
            const filters = new DistanceFilters();
            for (let index = 0; index < 20; index++) {
                filters.update(40 + speed * index * 0.1, index * 100);
                expect(Math.abs(filters.estimatedSpeedKmh!)).toBeLessThanOrEqual(20);
            }
            filters.reset();
            expect(filters.estimatedSpeedKmh).toBeNull();
        }
    });
    it('reduces steady motion lag for both alternatives compared with the fixed smoother', () => {
        const filters = new DistanceFilters();
        const results = Array.from({ length: 80 }, (_, index) =>
            filters.update(1 + index * 0.1, index * 100)
        );
        const error = (key: (typeof keys)[number]) =>
            results.slice(20).reduce((sum, record) => sum + Math.abs(record.selected! - record[key]!), 0);
        expect(error('oneEuro')).toBeLessThan(error('legacy') / 2);
        expect(error('kalman')).toBeLessThan(error('legacy') / 2);
    });
    it('reduces stationary measurement noise in both alternatives', () => {
        const filters = new DistanceFilters();
        const results = Array.from({ length: 80 }, (_, index) =>
            filters.update(2 + (index % 2 ? 0.05 : -0.05), index * 100)
        ).slice(20);
        for (const key of keys) {
            const deviation =
                results.reduce((sum, record) => sum + Math.abs(record[key]! - 2), 0) / results.length;
            expect(deviation).toBeLessThan(0.04);
        }
    });
    it('returns gaps without publishing predicted measurements, and resets all filters on target reacquisition', () => {
        const filters = new DistanceFilters();
        filters.update(2, 0);
        filters.update(2.1, 100);
        expect(filters.update(null, 200)).toEqual({
            timestamp: 200,
            selected: null,
            legacy: null,
            oneEuro: null,
            kalman: null
        });
        const result = filters.update(8, 300, true);
        keys.forEach((key) => expect(result[key]).toBe(8));
    });
    it('restarts after long gaps, timestamp rollback and an explicit reset', () => {
        const filters = new DistanceFilters();
        filters.update(2, 1000);
        for (const [value, timestamp] of [
            [8, 2500],
            [1, 0]
        ]) {
            const result = filters.update(value, timestamp);
            keys.forEach((key) => expect(result[key]).toBe(value));
        }
        filters.reset();
        keys.forEach((key) => expect(filters.update(4, 100)[key]).toBe(4));
    });
    it('uses identical recorded intervals for live and replay and handles duplicate timestamps', () => {
        const live = new DistanceFilters();
        const replay = new DistanceFilters();
        const timestamps = [0, 50, 279, 279, 400, 450, 900];
        const results: DistanceRecord[] = [];
        timestamps.forEach((timestamp, index) => {
            const distance = 1 + timestamp / 1000;
            const result = live.update(distance, timestamp);
            expect(replay.update(distance, timestamp)).toEqual(result);
            keys.forEach((key) => expect(Number.isFinite(result[key])).toBe(true));
            if (index === 3) keys.forEach((key) => expect(result[key]).toBe(results[2][key]));
            results.push(result);
        });
    });
});
