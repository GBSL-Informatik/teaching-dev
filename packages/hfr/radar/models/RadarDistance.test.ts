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

describe('Radar One Euro distances', () => {
    it('selects the nearest valid distance without custom motion, angle or speed gates', () => {
        const radar = createRadar();
        const targets = [
            { ...target(1), angle: 30, speed: 21 },
            target(2),
            target(NaN),
            target(Infinity),
            target(-1)
        ];
        radar.appendRecord({ timestamp: 0, source: 'live', targets });
        expect(radar.getMinimumDistance()).toBe(1);
        expect(radar.targets).toEqual(targets);
        append(radar, 100, [8]);
        expect(radar.getMinimumDistance()).toBeGreaterThan(1);
        expect(radar.getMinimumDistance()).toBeLessThan(8);
    });
    it('retains all measurements while exposing the last 100 filtered distances as chart history', () => {
        const radar = createRadar();
        for (let index = 0; index < 2100; index++) append(radar, index * 100, [2]);
        expect(radar.measurements).toHaveLength(2100);
        expect(radar.history).toEqual(Array(100).fill(2));
        expect(radar.getMinimumDistance(0)).toBe(2);
        expect(radar.getMinimumDistance()).toBe(2);
        expect(radar.getMinimumDistance(-1)).toBeNull();
    });
    it('holds the filtered distance when targets disappear, including invalid-only frames', () => {
        const radar = createRadar();
        append(radar, 0, []);
        expect(radar.getMinimumDistance()).toBeNull();
        append(radar, 100, [2]);
        append(radar, 200, [2.1]);
        const last = radar.getMinimumDistance();
        append(radar, 300, []);
        append(radar, 2000, [NaN, Infinity, -1]);
        expect(radar.history).toEqual([null, 2, last, last, last]);
        expect(radar.getMinimumDistance()).toBe(last);
        append(radar, 2100, []);
        expect(radar.targets).toEqual([]);
        expect(radar.getMinimumDistance()).toBe(last);
        radar.reset();
        expect(radar.measurements).toHaveLength(0);
        expect(radar.history).toEqual([]);
        expect(radar.getMinimumDistance()).toBeNull();
    });
    it('publishes the robust held median in history without altering detected values or raw records', () => {
        const radar = createRadar();
        [2, 2.1, 8].forEach((distance, index) => append(radar, index * 100, [distance]));
        const detected = radar.history.slice();
        expect(detected[2]).toBeGreaterThan(detected[1]!);
        append(radar, 300, []);
        append(radar, 1000, []);
        expect(radar.history).toEqual([...detected, detected[1], detected[1]]);
        expect(radar.getMinimumDistance()).toBe(detected[1]);
        expect(radar.getMinimumDistance(2)).toBe(detected[2]);
        expect(radar.measurements[2].targets[0].distance).toBe(8);
    });
    it('copies raw records and produces identical histories for live and replay, including held values', () => {
        const radar = createRadar();
        const replay = createRadar();
        const measurements = [2, 2.1, 8, null, null, 2.2].map((distance, index) => ({
            timestamp: index * 100,
            source: 'live' as const,
            targets: distance === null ? [] : [target(distance)]
        }));
        measurements.forEach((record) => {
            radar.appendRecord(record);
            replay.appendRecord({ ...record, source: 'replay' });
        });
        measurements[0].targets[0].distance = 99;
        expect(radar.measurements[0].targets[0].distance).toBe(2);
        expect(replay.history).toEqual(radar.history);
    });
});
