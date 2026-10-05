/// <reference types="w3c-web-serial" />
import { vi } from 'vitest';

export default class MockSerialPort extends EventTarget {
    readable: ReadableStream<Uint8Array> | null = null;
    writable: WritableStream<Uint8Array> | null = null;
    controller?: ReadableStreamDefaultController<Uint8Array>;
    writes: Uint8Array[] = [];
    onWrite?: (bytes: Uint8Array) => void;
    open = vi.fn(async (_options: SerialOptions) => {
        this.readable = new ReadableStream({
            start: (controller) => {
                this.controller = controller;
            }
        });
        this.writable = new WritableStream({
            write: (bytes) => {
                this.writes.push(bytes.slice());
                this.onWrite?.(bytes);
            }
        });
    });
    close = vi.fn(async () => {
        if (this.readable?.locked || this.writable?.locked) {
            throw new Error('Port streams are still locked');
        }
        this.readable = null;
        this.writable = null;
    });
    getInfo() {
        return { usbVendorId: 0x0403, usbProductId: 0x6001 };
    }
    receive(bytes: Uint8Array) {
        this.controller?.enqueue(bytes);
    }
    unplug() {
        this.controller?.error(new DOMException('Unplugged', 'NetworkError'));
        this.dispatchEvent(new Event('disconnect'));
    }
}

export const installPort = (port: MockSerialPort) => {
    const requestPort = vi.fn(async () => port as unknown as SerialPort);
    vi.stubGlobal('navigator', { serial: { requestPort } });
    vi.stubGlobal('window', new EventTarget());
    return requestPort;
};
