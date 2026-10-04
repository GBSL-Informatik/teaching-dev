import FtdiTransport, { getWebUsb, type RadarTransport } from './FtdiTransport';
import {
    decodeTargets,
    encodeCommand,
    FrameDecoder,
    settingCommands,
    type RadarFrame,
    type RadarSettings,
    type RadarTarget
} from './protocol';

const STATUS_MESSAGES = [
    'OK',
    'Unbekanntes Kommando',
    'Ungültiger Parameter',
    'Ungültige RPST-Version',
    'UART-Fehler',
    'Sensor beschäftigt',
    'Sensor-Timeout'
];

export default class RadarDevice {
    private decoder = new FrameDecoder();
    private pending?: {
        header: string;
        resolve: (frame: RadarFrame) => void;
        reject: (error: Error) => void;
    };
    private reading = false;
    private polling = false;
    private initialized = false;
    private pollTask?: Promise<void>;
    private readTask?: Promise<void>;
    private closing?: Promise<void>;
    private pollTimer?: ReturnType<typeof setTimeout>;
    private wakePoll?: () => void;

    constructor(private transport: RadarTransport) {}

    static async request(): Promise<RadarDevice> {
        const usb = getWebUsb();
        if (!usb) {
            throw new Error('WebUSB benötigt Chrome oder Edge auf HTTPS bzw. localhost.');
        }
        const device = await usb.requestDevice({ filters: [{ vendorId: 0x0403, productId: 0x6001 }] });
        return new RadarDevice(new FtdiTransport(device));
    }

    async connect(settings: RadarSettings): Promise<void> {
        settingCommands(settings);
        try {
            await this.transport.open();
            this.reading = true;
            this.readTask = this.readLoop();
            await this.command('INIT', 0); // Keep 115200 baud: sufficient for PDAT, no baud switch needed.
            this.initialized = true;
            for (const [header, value] of settingCommands(settings)) {
                await this.command(header, value);
            }
        } catch (error) {
            await this.close();
            throw error;
        }
    }

    private async readLoop(): Promise<void> {
        try {
            while (this.reading) {
                const frames = this.decoder.push(await this.transport.read());
                for (const frame of frames) {
                    if (this.pending?.header === frame.header) {
                        const pending = this.pending;
                        this.pending = undefined;
                        pending.resolve(frame);
                    }
                }
            }
        } catch (error) {
            if (this.reading) {
                this.reading = false;
                this.pending?.reject(error instanceof Error ? error : new Error(String(error)));
                this.pending = undefined;
            }
        }
    }

    private async receive(header: string, send?: Uint8Array): Promise<RadarFrame> {
        if (!this.reading) {
            throw new Error('Radar-Verbindung unterbrochen.');
        }
        if (this.pending) {
            throw new Error('Ein Radar-Kommando ist bereits aktiv.');
        }
        return new Promise<RadarFrame>((resolve, reject) => {
            const timeout = setTimeout(() => {
                this.pending = undefined;
                reject(new Error(`Keine ${header}-Antwort. Verkabelung prüfen und Radar neu einschalten.`));
            }, 2000);
            this.pending = {
                header,
                resolve: (frame) => {
                    clearTimeout(timeout);
                    resolve(frame);
                },
                reject: (error) => {
                    clearTimeout(timeout);
                    reject(error);
                }
            };
            if (send) {
                void this.transport.write(send).catch((error) => {
                    this.pending?.reject(error instanceof Error ? error : new Error(String(error)));
                    this.pending = undefined;
                });
            }
        });
    }

    private async command(header: string, value?: number): Promise<void> {
        const frame = await this.receive('RESP', encodeCommand(header, value));
        if (frame.payload.length !== 1 || frame.payload[0] !== 0) {
            throw new Error(`${header}: ${STATUS_MESSAGES[frame.payload[0]] || 'Ungültige Antwort'}`);
        }
    }

    async measure(): Promise<RadarTarget[]> {
        // RESP and PDAT may share one USB transfer. Install the data waiter inside the ACK handler.
        let response: Promise<RadarFrame> | undefined;
        const ack = this.receive('RESP');
        const pending = this.pending!;
        const resolveAck = pending.resolve;
        pending.resolve = (frame) => {
            if (frame.payload.length === 1 && frame.payload[0] === 0) {
                response = this.receive('PDAT');
                // Attach a rejection handler immediately, including when the write fails.
                void response.catch(() => {});
            }
            resolveAck(frame);
        };
        void this.transport.write(encodeCommand('GNFD', 4)).catch((error) => {
            this.pending?.reject(error instanceof Error ? error : new Error(String(error)));
            this.pending = undefined;
        });
        const frame = await ack;
        if (!response) {
            throw new Error(`GNFD: ${STATUS_MESSAGES[frame.payload[0]] || 'Ungültige Antwort'}`);
        }
        return decodeTargets((await response).payload);
    }

    start(onTargets: (targets: RadarTarget[]) => void, onError: (error: Error) => void): void {
        if (this.polling) {
            return;
        }
        this.polling = true;
        this.pollTask = (async () => {
            try {
                while (this.polling) {
                    const targets = await this.measure();
                    if (!this.polling) {
                        break;
                    }
                    onTargets(targets);
                    await new Promise<void>((resolve) => {
                        this.wakePoll = resolve;
                        this.pollTimer = setTimeout(resolve, 100);
                    });
                    this.wakePoll = undefined;
                }
            } catch (error) {
                if (this.polling) {
                    this.polling = false;
                    onError(error instanceof Error ? error : new Error(String(error)));
                }
            }
        })();
    }

    close(): Promise<void> {
        if (this.closing) {
            return this.closing;
        }
        this.closing = this.disconnect();
        return this.closing;
    }

    private async disconnect(): Promise<void> {
        this.polling = false;
        clearTimeout(this.pollTimer);
        this.wakePoll?.();
        await this.pollTask;
        try {
            if (this.initialized && this.reading) {
                await this.command('GBYE');
            }
        } catch {
            // Closing USB must still succeed when the sensor was unplugged.
        } finally {
            this.reading = false;
            this.pending?.reject(new Error('Verbindung geschlossen.'));
            this.pending = undefined;
            await this.transport.close().catch(() => {});
            await this.readTask;
        }
    }
}
