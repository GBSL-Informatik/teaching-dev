import { describe, expect, it } from 'vitest';
import WebserialStore from '../../../tdev/webserial/stores/WebserialStore';
import RadarDevice from './RadarDevice';
import type { RadarTarget } from './protocol';

const target = (distance: number): RadarTarget => ({
    distance,
    angle: 0,
    speed: 0,
    magnitude: 30,
    x: 0,
    y: distance
});
const createRadar = () => RadarDevice.request(new WebserialStore({} as never), 'distance-test');
const append = (radar: RadarDevice, timestamp: number, distances: number[]) =>
    radar.appendRecord({ timestamp, source: 'live', targets: distances.map(target) });

describe('Radar distance tracking', () => {
    it('selects a central person below 20 km/h while retaining all raw targets', () => {
        const radar = createRadar();
        const targets = [
            { ...target(1), angle: 30 },
            { ...target(1.5), speed: 21 },
            { ...target(2), angle: 5, speed: -18 }
        ];
        radar.appendRecord({ timestamp: 0, source: 'live', targets });
        expect(radar.getMinimumDistance()).toBe(2);
        expect(radar.targets).toEqual(targets);
        radar.appendRecord({
            timestamp: 100,
            source: 'live',
            targets: [
                { ...target(1), angle: -16 },
                { ...target(1.5), speed: -21 }
            ]
        });
        expect(radar.getMinimumDistance()).toBeNull();
        expect(radar.comparisonHistory.at(-1)?.kalman).toBeNull();
    });
    it('allows movement at 20 km/h within the central corridor', () => {
        const radar = createRadar();
        for (let index = 0; index < 10; index++) {
            radar.appendRecord({
                timestamp: index * 100,
                source: 'live',
                targets: [{ ...target(2 + index * (20 / 3.6) * 0.1), angle: 15, speed: 20 }]
            });
        }
        expect(radar.comparisonHistory.every((record) => record.kalman !== null)).toBe(true);
    });
    it('retains all raw measurements while exposing only the last 100 filtered distances as chart history', () => {
        const radar = createRadar();
        for (let index = 0; index < 2100; index++) append(radar, index * 100, [2]);
        expect(radar.measurements).toHaveLength(2100);
        expect(radar.history).toEqual(Array(100).fill(2));
        expect(radar.getMinimumDistance(0)).toBe(2);
        expect(radar.getMinimumDistance()).toBe(2);
        expect(radar.getMinimumDistance(-1)).toBeNull();
    });
    it('starts with the nearest object and follows its movement instead of jumping to closer clutter', () => {
        const radar = createRadar();
        append(radar, 0, [5, 2]);
        append(radar, 100, [0.1, 5, 2.1]);
        append(radar, 200, [2.2, 0.2, 5]);
        expect(radar.history[0]).toBe(2);
        expect(radar.history[1]).toBeGreaterThan(2);
        expect(radar.history[1]).toBeLessThan(2.1);
        expect(radar.getMinimumDistance()).toBeGreaterThan(radar.history[1]!);
        expect(radar.getMinimumDistance()).toBeLessThan(2.2);
        expect(radar.targets.map((value) => value.distance)).toEqual([2.2, 0.2, 5]);
        expect(radar.comparisonHistory.map((record) => record.selected)).toEqual([2, 2.1, 2.2]);
    });
    it('reduces stationary jitter and rejects an isolated impossible jump', () => {
        const radar = createRadar();
        append(radar, 0, [2]);
        append(radar, 100, [2.1]);
        expect(radar.getMinimumDistance()).toBeCloseTo(2.0487, 3);
        append(radar, 200, [8]);
        expect(radar.getMinimumDistance()).toBeNull();
        expect(radar.comparisonHistory.at(-1)).toMatchObject({ legacy: null, oneEuro: null, kalman: null });
        append(radar, 300, [2]);
        expect(radar.getMinimumDistance()).toBeCloseTo(2, 1);
    });
    it('uses the movement trend to choose between multiple physically plausible targets', () => {
        const radar = createRadar();
        append(radar, 0, [2]);
        append(radar, 100, [2.1]);
        append(radar, 200, [2.2]);
        append(radar, 300, [2.15, 2.3]);
        const expected = createRadar();
        [2, 2.1, 2.2, 2.3].forEach((distance, index) => append(expected, index * 100, [distance]));
        expect(radar.history).toEqual(expected.history);
    });
    it('confirms a persistent new object over three frames instead of rejecting it forever', () => {
        const radar = createRadar();
        append(radar, 0, [2]);
        append(radar, 100, [8]);
        append(radar, 200, [8.1]);
        expect(radar.history).toEqual([2, null, null]);
        append(radar, 300, [8.2]);
        expect(radar.getMinimumDistance()).toBe(8.2);
    });
    it('keeps gaps, discards invalid distances and reacquires after a long gap or timestamp restart', () => {
        const radar = createRadar();
        append(radar, 0, [2]);
        append(radar, 100, []);
        append(radar, 200, [NaN, Infinity, -1]);
        expect(radar.history).toEqual([2, null, null]);
        append(radar, 1500, [8]);
        expect(radar.getMinimumDistance()).toBe(8);
        append(radar, 0, [1]);
        expect(radar.getMinimumDistance()).toBe(1);
        radar.reset();
        expect(radar.measurements).toHaveLength(0);
        expect(radar.history).toEqual([]);
        expect(radar.comparisonHistory).toEqual([]);
        expect(radar.getMinimumDistance()).toBeNull();
    });
    it('copies appended records and produces the same history for replay at a different wall-clock speed', () => {
        const radar = createRadar();
        const replay = createRadar();
        const measurements = [2, 2.1, 2.2].map((distance, index) => ({
            timestamp: index * 100,
            source: 'live' as const,
            targets: [target(distance)]
        }));
        measurements.forEach((record) => {
            radar.appendRecord(record);
            replay.appendRecord({ ...record, source: 'replay' });
        });
        measurements[0].targets[0].distance = 99;
        expect(radar.measurements[0].targets[0].distance).toBe(2);
        expect(replay.history).toEqual(radar.history);
        expect(replay.comparisonHistory).toEqual(radar.comparisonHistory);
    });
});
