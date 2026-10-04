import { afterEach, describe, expect, it, vi } from 'vitest';
import RadarDevice from './RadarDevice';
import WebserialStore from '../../../tdev/webserial/stores/WebserialStore';
import MockSerialPort, { installPort } from '../../../tdev/webserial/models/__tests__/MockSerialPort';
import { DEFAULT_SETTINGS } from './protocol';

const frame = (header: string, payload: number[] = []): Uint8Array => {
    const bytes = new Uint8Array(8 + payload.length);
    bytes.set(new TextEncoder().encode(header));
    new DataView(bytes.buffer).setUint32(4, payload.length, true);
    bytes.set(payload, 8);
    return bytes;
};

class Sensor extends MockSerialPort {
    commands: string[] = [];
    fail?: string;
    silent?: string;
    constructor() {
        super();
        this.onWrite = (bytes) => {
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
            this.receive(combined);
        };
    }
}

const createRadar = (sensor: Sensor) => {
    installPort(sensor);
    const store = new WebserialStore({} as never);
    return RadarDevice.request(store, 'radar-test');
};

afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
});

describe('Radar lifecycle', () => {
    it('replays generated demo PDAT data through the shared serial device without hardware writes', async () => {
        vi.useFakeTimers();
        const sensor = new Sensor();
        const radar = createRadar(sensor);
        const listener = vi.fn();
        const onReset = vi.fn();
        const unsubscribe = radar.subscribe(listener, onReset);
        const initialData = RadarDevice.createDemoData(10, 5);
        radar.device.setReplayData(initialData);
        radar.device.setReplaySpeed(100);
        radar.device.replay();
        await vi.advanceTimersByTimeAsync(300);
        expect(listener).toHaveBeenCalledTimes(3);
        expect(onReset).toHaveBeenCalled();
        expect(radar.measurements[0]).toMatchObject({ source: 'replay', timestamp: 0 });
        expect(radar.measurements[0].targets).toHaveLength(3);
        const target = radar.measurements[2].targets[0];
        expect(Math.hypot(target.x, target.y)).toBeCloseTo(target.distance);
        expect(sensor.open).not.toHaveBeenCalled();
        expect(sensor.writes).toHaveLength(0);
        await radar.close();
        const calls = listener.mock.calls.length;
        await vi.advanceTimersByTimeAsync(300);
        expect(listener).toHaveBeenCalledTimes(calls);
        expect(radar.device.receivedData).toEqual(initialData);
        unsubscribe();
    });
    it('keeps one radar controller per shared device while allowing additional byte subscribers', async () => {
        installPort(new Sensor());
        const store = new WebserialStore({} as never);
        const radar = RadarDevice.request(store, 'shared');
        expect(RadarDevice.request(store, 'shared')).toBe(radar);
        const subscriber = { id: 'other-decoder', reset: vi.fn(), onNewBytes: vi.fn() };
        radar.device.subscribe(subscriber);
        await radar.connect(DEFAULT_SETTINGS);
        await radar.measure();
        expect(subscriber.onNewBytes).toHaveBeenCalled();
        await radar.close();
        const next = RadarDevice.request(store, 'shared');
        await next.close();
    });
    it('configures the sensor, reads combined ACK/PDAT and disconnects gracefully', async () => {
        const sensor = new Sensor();
        const radar = createRadar(sensor);
        await radar.connect(DEFAULT_SETTINGS);
        expect(sensor.commands).toEqual(['INIT', 'RBFR', 'RSPI', 'RRAI', 'TRFT', 'MIDS']);
        expect((await radar.measure())[0].distance).toBe(0.8);
        await radar.close();
        expect(sensor.commands.at(-1)).toBe('GBYE');
        expect(sensor.close).toHaveBeenCalledOnce();
    });
    it('closes the shared serial device after a rejected setting', async () => {
        const sensor = new Sensor();
        sensor.fail = 'RRAI';
        const radar = createRadar(sensor);
        await expect(radar.connect(DEFAULT_SETTINGS)).rejects.toThrow('RRAI');
        expect(sensor.close).toHaveBeenCalledOnce();
        sensor.fail = undefined;
        await radar.connect(DEFAULT_SETTINGS);
        expect((await radar.measure())[0].distance).toBe(0.8);
        await radar.close();
    });
    it('rejects sensor errors without waiting for PDAT', async () => {
        const sensor = new Sensor();
        const radar = createRadar(sensor);
        await radar.connect(DEFAULT_SETTINGS);
        sensor.fail = 'GNFD';
        await expect(radar.measure()).rejects.toThrow('Ungültiger Parameter');
        await radar.close();
    });
    it('times out a missing ACK and releases the serial port', async () => {
        vi.useFakeTimers();
        try {
            const sensor = new Sensor();
            sensor.silent = 'INIT';
            const radar = createRadar(sensor);
            const result = expect(radar.connect(DEFAULT_SETTINGS)).rejects.toThrow('Keine RESP-Antwort');
            await vi.advanceTimersByTimeAsync(2100);
            await result;
            expect(sensor.close).toHaveBeenCalledOnce();
        } finally {
            vi.useRealTimers();
        }
    });
    it('stops polling before GBYE, with no more measurements after close', async () => {
        const sensor = new Sensor();
        const radar = createRadar(sensor);
        await radar.connect(DEFAULT_SETTINGS);
        await new Promise<void>((resolve, reject) => radar.start(() => resolve(), reject));
        await radar.close();
        expect(sensor.commands.slice(-2)).toEqual(['GNFD', 'GBYE']);
        expect(sensor.close).toHaveBeenCalledOnce();
    });
    it('records and replays fragmented radar frames without sending hardware commands', async () => {
        vi.useFakeTimers();
        const sensor = new Sensor();
        const radar = createRadar(sensor);
        await radar.connect(DEFAULT_SETTINGS);
        const measurementListener = vi.fn();
        radar.subscribe(measurementListener);
        await radar.measure();
        await radar.disconnect();
        const recorded = radar.device.receivedData.map((sample) => ({
            timestamp: sample.timestamp,
            bytes: sample.bytes.slice()
        }));
        const writeCount = sensor.writes.length;
        radar.device.setReplaySpeed(10);
        radar.device.replay();
        await vi.advanceTimersByTimeAsync((recorded.length + 2) * 10);
        expect(sensor.writes).toHaveLength(writeCount);
        expect(radar.device.receivedData).toEqual(recorded);
        expect(radar.measurements).toHaveLength(1);
        expect(radar.measurements[0].source).toBe('replay');
        expect(measurementListener.mock.calls.at(-1)?.[0].timestamp).toBe(
            recorded.find((sample) => new TextDecoder().decode(sample.bytes).includes('PDAT'))?.timestamp
        );
        await radar.close();
    });
    it('stops invalid replay data without throwing from the replay timer or sending bytes', async () => {
        vi.useFakeTimers();
        const sensor = new Sensor();
        const radar = createRadar(sensor);
        radar.device.setReplayData([{ timestamp: 10, bytes: new Uint8Array(8) }]);
        radar.device.replay();
        await vi.advanceTimersByTimeAsync(300);
        expect(radar.device.isReplaying).toBe(false);
        expect(radar.device.error).toContain('Datenrahmen');
        expect(sensor.writes).toHaveLength(0);
        await radar.close();
    });
    it('decodes byte-by-byte replay including arbitrary binary values and empty PDAT frames', async () => {
        vi.useFakeTimers();
        const radar = createRadar(new Sensor());
        const payload = [0x0a, 0x0d, 0xff, 0xff, 0, 0, 0xff, 0];
        const bytes = new Uint8Array([...frame('PDAT', payload), ...frame('PDAT', [])]);
        radar.device.setReplayData(
            [...bytes].map((byte, index) => ({ timestamp: index, bytes: new Uint8Array([byte]) }))
        );
        radar.device.setReplaySpeed(1);
        radar.device.replay();
        await vi.advanceTimersByTimeAsync(bytes.length + 2);
        expect(radar.measurements).toHaveLength(2);
        expect(radar.measurements[0].targets[0].distance).toBe(33.38);
        expect(radar.measurements[1].targets).toEqual([]);
        await radar.close();
    });
});
