import { describe, expect, it } from 'vitest';
import { decodeTargets, encodeCommand, FrameDecoder, settingCommands, DEFAULT_SETTINGS } from './protocol';

const frame = (header: string, payload: number[] = []): Uint8Array => {
    const result = new Uint8Array(8 + payload.length);
    result.set(new TextEncoder().encode(header));
    new DataView(result.buffer).setUint32(4, payload.length, true);
    result.set(payload, 8);
    return result;
};

const join = (...parts: Uint8Array[]): Uint8Array => {
    const result = new Uint8Array(parts.reduce((length, part) => length + part.length, 0));
    let offset = 0;
    parts.forEach((part) => {
        result.set(part, offset);
        offset += part.length;
    });
    return result;
};

describe('K-LD7 binary protocol', () => {
    it('encodes INIT and GBYE according to the datasheet', () => {
        expect([...encodeCommand('INIT', 0)]).toEqual([73, 78, 73, 84, 4, 0, 0, 0, 0, 0, 0, 0]);
        expect([...encodeCommand('GBYE')]).toEqual([71, 66, 89, 69, 0, 0, 0, 0]);
    });
    it('handles fragmented headers, fragmented payloads and combined frames', () => {
        const bytes = join(frame('RESP', [0]), frame('PDAT', [80, 0, 100, 0, 0, 0, 100, 0]));
        const decoder = new FrameDecoder();
        expect(decoder.push(bytes.slice(0, 3))).toEqual([]);
        expect(decoder.push(bytes.slice(3, 8))).toEqual([]);
        expect(decoder.push(bytes.slice(8))).toHaveLength(2);
    });
    it('converts cm, signed speed/angle and dB into display units', () => {
        const target = decodeTargets(new Uint8Array([0x50, 0, 0x9c, 0xff, 0x48, 0xf4, 0xb8, 0x0b]))[0];
        expect(target.distance).toBe(0.8);
        expect(target.speed).toBe(-1);
        expect(target.angle).toBe(-30);
        expect(target.magnitude).toBe(30);
        expect(target.x).toBeCloseTo(0.4);
        expect(target.y).toBeCloseTo(0.69282);
        expect(decodeTargets(new Uint8Array())).toEqual([]);
    });
    it('rejects malformed payloads, oversized lengths and invalid settings', () => {
        expect(() => decodeTargets(new Uint8Array(7))).toThrow();
        expect(() => new FrameDecoder().push(new Uint8Array([80, 68, 65, 84, 0, 0, 1, 0]))).toThrow();
        expect(() => settingCommands({ ...DEFAULT_SETTINGS, range: 4 })).toThrow();
    });
});
