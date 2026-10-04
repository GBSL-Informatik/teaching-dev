export interface RadarTransport {
    open(): Promise<void>;
    read(): Promise<Uint8Array>;
    write(bytes: Uint8Array): Promise<void>;
    close(): Promise<void>;
}

export interface RadarSerialPort {
    readable: ReadableStream<Uint8Array> | null;
    writable: WritableStream<Uint8Array> | null;
    open(options: {
        baudRate: number;
        dataBits: 8;
        parity: 'even';
        stopBits: 1;
        flowControl: 'none';
        bufferSize: number;
    }): Promise<void>;
    close(): Promise<void>;
}

interface WebSerial {
    requestPort(options: {
        filters: { usbVendorId: number; usbProductId: number }[];
    }): Promise<RadarSerialPort>;
}

export const getWebSerial = (): WebSerial | undefined => {
    return typeof navigator === 'undefined'
        ? undefined
        : (navigator as Navigator & { serial?: WebSerial }).serial;
};

/** Uses the existing FTDI virtual COM port driver, without raw USB access. */
export default class WebSerialTransport implements RadarTransport {
    private reader?: ReadableStreamDefaultReader<Uint8Array>;
    private writer?: WritableStreamDefaultWriter<Uint8Array>;
    private opened = false;

    constructor(private port: RadarSerialPort) {}

    async open(): Promise<void> {
        try {
            await this.port.open({
                baudRate: 115200,
                dataBits: 8,
                parity: 'even',
                stopBits: 1,
                flowControl: 'none',
                bufferSize: 4096
            });
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            throw new Error(
                `Serieller Port kann nicht geöffnet werden. Hersteller-Software und andere Programme mit Zugriff auf den COM-Port schliessen. ${message}`
            );
        }
        this.opened = true;
        if (!this.port.readable || !this.port.writable) {
            throw new Error('Der serielle Port stellt keine Datenströme bereit.');
        }
        this.reader = this.port.readable.getReader();
        this.writer = this.port.writable.getWriter();
    }

    async read(): Promise<Uint8Array> {
        if (!this.reader) {
            throw new Error('Serieller Port ist nicht verbunden.');
        }
        const { value, done } = await this.reader.read();
        if (done) {
            throw new Error('Serielle Verbindung geschlossen.');
        }
        return value;
    }

    async write(bytes: Uint8Array): Promise<void> {
        if (!this.writer) {
            throw new Error('Serieller Port ist nicht verbunden.');
        }
        await this.writer.write(bytes);
    }

    async close(): Promise<void> {
        // Cancel pending reads and release stream locks before closing the port.
        if (this.reader) {
            await this.reader.cancel().catch(() => {});
            this.reader.releaseLock();
            this.reader = undefined;
        }
        this.writer?.releaseLock();
        this.writer = undefined;
        if (this.opened) {
            this.opened = false;
            await this.port.close();
        }
    }
}
