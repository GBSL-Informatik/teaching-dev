import { describe, expect, it, vi } from 'vitest';
import WebSerialTransport, { type RadarSerialPort } from './WebSerialTransport';
import RadarDevice from './RadarDevice';
import { DEFAULT_SETTINGS } from './protocol';

const response = (header: string, payload: number[]): Uint8Array => {
    const bytes = new Uint8Array(8 + payload.length);
    bytes.set(new TextEncoder().encode(header));
    new DataView(bytes.buffer).setUint32(4, payload.length, true);
    bytes.set(payload, 8);
    return bytes;
};

const createPort = () => {
    let controller!: ReadableStreamDefaultController<Uint8Array>;
    const commands: string[] = [];
    const port: RadarSerialPort = {
        readable: new ReadableStream({
            start: (value) => {
                controller = value;
            }
        }),
        writable: new WritableStream({
            write: (bytes) => {
                const command = new TextDecoder().decode(bytes.subarray(0, 4));
                commands.push(command);
                controller.enqueue(response('RESP', [0]));
                if (command === 'GNFD') {
                    controller.enqueue(response('PDAT', [80, 0, 0, 0, 0, 0, 100, 0]));
                }
            }
        }),
        open: vi.fn(async () => {}),
        close: vi.fn(async () => {
            if (port.readable?.locked || port.writable?.locked) {
                throw new Error('Stream still locked');
            }
        })
    };
    return { port, commands };
};

describe('WebSerial transport', () => {
    it('uses 115200 8E1 and the same radar protocol through the existing COM port', async () => {
        const { port, commands } = createPort();
        const radar = new RadarDevice(new WebSerialTransport(port));
        await radar.connect(DEFAULT_SETTINGS);
        expect(port.open).toHaveBeenCalledWith({
            baudRate: 115200,
            dataBits: 8,
            parity: 'even',
            stopBits: 1,
            flowControl: 'none',
            bufferSize: 4096
        });
        expect((await radar.measure())[0].distance).toBe(0.8);
        await radar.close();
        expect(commands).toEqual(['INIT', 'RBFR', 'RSPI', 'RRAI', 'TRFT', 'MIDS', 'GNFD', 'GBYE']);
        expect(port.close).toHaveBeenCalledOnce();
        expect(port.readable?.locked).toBe(false);
        expect(port.writable?.locked).toBe(false);
    });
    it('cancels a pending read before releasing locks and closing the port', async () => {
        const { port } = createPort();
        const transport = new WebSerialTransport(port);
        await transport.open();
        const read = expect(transport.read()).rejects.toThrow('geschlossen');
        await transport.close();
        await read;
        expect(port.close).toHaveBeenCalledOnce();
    });
    it('reports a blocked COM port and avoids closing an unopened port', async () => {
        const { port } = createPort();
        vi.mocked(port.open).mockRejectedValue(new DOMException('Access denied', 'NetworkError'));
        const transport = new WebSerialTransport(port);
        await expect(transport.open()).rejects.toThrow('Hersteller-Software');
        await transport.close();
        expect(port.close).not.toHaveBeenCalled();
    });
});
