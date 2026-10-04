import { describe, expect, it, vi } from 'vitest';
import RadarDevice from './RadarDevice';
import { type RadarTransport } from './FtdiTransport';
import { DEFAULT_SETTINGS } from './protocol';

const frame = (header: string, payload: number[] = []): Uint8Array => {
    const bytes = new Uint8Array(8 + payload.length);
    bytes.set(new TextEncoder().encode(header));
    new DataView(bytes.buffer).setUint32(4, payload.length, true);
    bytes.set(payload, 8);
    return bytes;
};

class Sensor implements RadarTransport {
    commands: string[] = [];
    closed = false;
    fail?: string;
    silent?: string;
    private queue: Uint8Array[] = [];
    private reader?: { resolve: (bytes: Uint8Array) => void; reject: (error: Error) => void };
    async open() {}
    read(): Promise<Uint8Array> {
        const bytes = this.queue.shift();
        if (bytes) {
            return Promise.resolve(bytes);
        }
        return new Promise((resolve, reject) => {
            this.reader = { resolve, reject };
        });
    }
    async write(bytes: Uint8Array) {
        const command = new TextDecoder().decode(bytes.subarray(0, 4));
        this.commands.push(command);
        if (this.silent === command) {
            return;
        }
        const ack = frame('RESP', [this.fail === command ? 2 : 0]);
        const data =
            command === 'GNFD' && this.fail !== command
                ? frame('PDAT', [80, 0, 100, 0, 0, 0, 100, 0])
                : new Uint8Array();
        const combined = new Uint8Array(ack.length + data.length);
        combined.set(ack);
        combined.set(data, ack.length);
        if (this.reader) {
            const reader = this.reader;
            this.reader = undefined;
            reader.resolve(combined);
        } else {
            this.queue.push(combined);
        }
    }
    async close() {
        this.closed = true;
        this.reader?.reject(new Error('USB disconnected'));
        this.reader = undefined;
    }
}

describe('Radar lifecycle', () => {
    it('configures the sensor, reads combined ACK/PDAT and disconnects gracefully', async () => {
        const sensor = new Sensor();
        const radar = new RadarDevice(sensor);
        await radar.connect(DEFAULT_SETTINGS);
        expect(sensor.commands).toEqual(['INIT', 'RBFR', 'RSPI', 'RRAI', 'TRFT', 'MIDS']);
        expect((await radar.measure())[0].distance).toBe(0.8);
        await radar.close();
        expect(sensor.commands.at(-1)).toBe('GBYE');
        expect(sensor.closed).toBe(true);
    });
    it('closes USB after a rejected setting', async () => {
        const sensor = new Sensor();
        sensor.fail = 'RRAI';
        await expect(new RadarDevice(sensor).connect(DEFAULT_SETTINGS)).rejects.toThrow('RRAI');
        expect(sensor.closed).toBe(true);
    });
    it('rejects sensor errors without waiting for PDAT', async () => {
        const sensor = new Sensor();
        const radar = new RadarDevice(sensor);
        await radar.connect(DEFAULT_SETTINGS);
        sensor.fail = 'GNFD';
        await expect(radar.measure()).rejects.toThrow('Ungültiger Parameter');
        await radar.close();
    });
    it('times out a missing ACK and releases the USB device', async () => {
        vi.useFakeTimers();
        try {
            const sensor = new Sensor();
            sensor.silent = 'INIT';
            const radar = new RadarDevice(sensor);
            const result = expect(radar.connect(DEFAULT_SETTINGS)).rejects.toThrow('Keine RESP-Antwort');
            await vi.advanceTimersByTimeAsync(2100);
            await result;
            expect(sensor.closed).toBe(true);
        } finally {
            vi.useRealTimers();
        }
    });
    it('stops polling before GBYE, with no more measurements after close', async () => {
        const sensor = new Sensor();
        const radar = new RadarDevice(sensor);
        await radar.connect(DEFAULT_SETTINGS);
        await new Promise<void>((resolve, reject) => radar.start(() => resolve(), reject));
        await radar.close();
        expect(sensor.commands.slice(-2)).toEqual(['GNFD', 'GBYE']);
        expect(sensor.closed).toBe(true);
    });
});
