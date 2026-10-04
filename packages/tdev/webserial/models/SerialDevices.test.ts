import { afterEach, describe, expect, it, vi } from 'vitest';
import SerialDevice from './SerialDevice';
import SerialTextDevice from './SerialTextDevice';
import WebserialStore from '../stores/WebserialStore';
import MockSerialPort, { installPort } from './__tests__/MockSerialPort';

const store = () => new WebserialStore({} as never);
afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
});

describe('Shared serial devices', () => {
    it('preserves the SerialDevice compatibility import and UTF-8 text framing', async () => {
        const port = new MockSerialPort();
        installPort(port);
        const device = new SerialDevice({}, {}, store());
        expect(device).toBeInstanceOf(SerialTextDevice);
        const subscriber = { id: 'text', reset: vi.fn(), onNewLines: vi.fn() };
        device.subscribe(subscriber);
        await device.connect();
        const bytes = new TextEncoder().encode('Grüsse\r\nnext\n');
        port.receive(bytes.slice(0, 3));
        port.receive(bytes.slice(3));
        await vi.waitFor(() => expect(device.receivedData.slice()).toEqual(['Grüsse', 'next']));
        await device.sendLine('hello');
        expect(new TextDecoder().decode(port.writes[0])).toBe('hello\n');
        await device.disconnect();
        expect(port.close).toHaveBeenCalledOnce();
    });
    it('preserves text replay, reset triggers and rolling buffers', () => {
        vi.useFakeTimers();
        const device = store().useDevice('text', {}, { dataBufferSize: 4, resetTrigger: 'RESET' });
        const subscriber = { id: 'text', reset: vi.fn(), onNewLines: vi.fn() };
        device.subscribe(subscriber);
        device.appendReceivedData('one\ntwo\n');
        device.replay();
        vi.advanceTimersByTime(1000);
        expect(device.receivedData.slice()).toEqual(['one', 'two']);
        device.appendReceivedData('three\nfour\nfive\n');
        expect(device.size).toBe(2);
        device.appendReceivedData('RESET\n');
        expect(device.size).toBe(0);
        expect(subscriber.reset).toHaveBeenCalled();
    });
    it('shares device IDs and rejects conflicting text/binary access', () => {
        const shared = store();
        expect(shared.useDevice('text')).toBe(shared.useDevice('text'));
        expect(shared.useBinaryDevice('binary')).toBe(shared.useBinaryDevice('binary'));
        expect(() => shared.useBinaryDevice('text')).toThrow('text mode');
        expect(() => shared.useDevice('binary')).toThrow('binary mode');
        expect(() => shared.useBinaryDevice('binary', { parity: 'even' })).toThrow(
            'conflicting serial option'
        );
    });
    it('opens a shared port only once and releases a pending read before reconnecting', async () => {
        const port = new MockSerialPort();
        const requestPort = installPort(port);
        const device = store().useBinaryDevice('binary');
        await Promise.all([device.connect(), device.connect()]);
        expect(requestPort).toHaveBeenCalledOnce();
        await device.disconnect();
        expect(port.close).toHaveBeenCalledOnce();
        await device.connect();
        expect(port.open).toHaveBeenCalledTimes(2);
        await device.disconnect();
    });
    it('cancels a connection while opening and closes the subsequently opened port', async () => {
        const port = new MockSerialPort();
        installPort(port);
        let release!: () => void;
        const originalOpen = port.open.getMockImplementation()!;
        port.open.mockImplementation(async (options) => {
            await originalOpen(options);
            await new Promise<void>((resolve) => {
                release = resolve;
            });
        });
        const device = store().useBinaryDevice('binary');
        const connection = device.connect();
        await vi.waitFor(() => expect(port.open).toHaveBeenCalledOnce());
        await device.disconnect();
        release();
        await connection;
        expect(port.close).toHaveBeenCalledOnce();
        expect(device.isConnected).toBe(false);
    });
    it('records copied binary chunks and supports pause, resume and full restoration', () => {
        vi.useFakeTimers();
        const device = store().useBinaryDevice('binary');
        const subscriber = {
            id: 'bytes',
            reset: vi.fn(),
            onNewBytes: vi.fn((bytes: Uint8Array) => {
                bytes[0] = 0;
            })
        };
        device.subscribe(subscriber);
        const bytes = new Uint8Array([0xff, 0x0d, 0x0a, 0x80]);
        device.appendReceivedData({ bytes, timestamp: 12 });
        bytes[0] = 1;
        expect([...device.receivedData[0].bytes]).toEqual([0xff, 0x0d, 0x0a, 0x80]);
        device.appendReceivedData({ bytes: new Uint8Array([2]), timestamp: 24 });
        const recording = device.receivedData.slice();
        device.replay();
        vi.advanceTimersByTime(250);
        device.pauseReplay();
        expect(device.isReplayPaused).toBe(true);
        device.replay(device._replayPausedAt);
        vi.advanceTimersByTime(750);
        expect(device.receivedData.slice()).toEqual(recording);
        expect(subscriber.onNewBytes).toHaveBeenCalledWith(expect.any(Uint8Array), 12);
    });
    it('releases removed or failed ports and allows the store to clear devices', async () => {
        const port = new MockSerialPort();
        installPort(port);
        const shared = store();
        const device = shared.useBinaryDevice('binary');
        await device.connect();
        port.unplug();
        await vi.waitFor(() => expect(device.isConnected).toBe(false));
        await shared.clearDevice('binary');
        expect(shared.devices.has('binary')).toBe(false);
        expect(port.close).toHaveBeenCalledOnce();
    });
});
