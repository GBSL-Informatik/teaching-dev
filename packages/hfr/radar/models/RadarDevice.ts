import type SerialBinaryDevice from '@tdev/webserial/models/SerialBinaryDevice';
import type { ConnectionState, iBinarySubscriber } from '@tdev/webserial/models/SerialDevice';
import type WebserialStore from '@tdev/webserial/stores/WebserialStore';
import { action, observable } from 'mobx';
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

export interface RadarMeasurement {
    timestamp: number;
    source: 'live' | 'replay' | 'demo';
    targets: RadarTarget[];
}

export default class RadarDevice implements iBinarySubscriber {
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
    private pollTimer?: ReturnType<typeof setTimeout>;
    private wakePoll?: () => void;
    private demoTimer?: ReturnType<typeof setInterval>;

    readonly measurements = observable.array<RadarMeasurement>([], { deep: false });
    private listeners = new Set<(measurement: RadarMeasurement) => void>();
    private onTargets?: (targets: RadarTarget[]) => void;
    private onError?: (error: Error) => void;
    private onReset?: () => void;

    constructor(
        readonly device: SerialBinaryDevice,
        readonly id = 'radar-decoder'
    ) {
        this.device.subscribe(this);
    }

    static request(store: WebserialStore, id: string): RadarDevice {
        const device = store.useBinaryDevice(
            id,
            {
                baudRate: 115200,
                dataBits: 8,
                parity: 'even',
                stopBits: 1,
                flowControl: 'none',
                bufferSize: 4096
            },
            { dataBufferSize: 0, portFilters: [{ usbVendorId: 0x0403, usbProductId: 0x6001 }] }
        );
        return new RadarDevice(device, `${id}-decoder`);
    }

    subscribe(listener: (measurement: RadarMeasurement) => void): () => void {
        this.listeners.add(listener);
        return () => {
            this.listeners.delete(listener);
        };
    }

    startDemo(range: number, onTargets: (targets: RadarTarget[]) => void): void {
        if (this.device.isConnected || this.device.isReplaying || this.device.isReplayPaused) {
            throw new Error('Demo benötigt ein getrenntes Radar ohne aktives Replay.');
        }
        this.stopDemo();
        this.reset();
        this.onTargets = onTargets;
        let tick = 0;
        const sample = () => {
            tick += 0.12;
            const targets = [0, 1, 2].map((index) => {
                const distance = range * (0.24 + index * 0.2 + Math.sin(tick + index) * 0.08);
                const angle = Math.sin(tick / 3 + index * 2) * 35;
                const radians = (angle * Math.PI) / 180;
                return {
                    distance,
                    angle,
                    speed: Math.cos(tick + index) * 2,
                    magnitude: 30 + index * 5,
                    x: -distance * Math.sin(radians),
                    y: distance * Math.cos(radians)
                };
            });
            this.publish({ timestamp: Date.now(), source: 'demo', targets });
        };
        sample();
        this.demoTimer = setInterval(sample, 100);
    }

    stopDemo(): void {
        clearInterval(this.demoTimer);
        this.demoTimer = undefined;
    }

    @action
    private publish(measurement: RadarMeasurement): void {
        this.measurements.push(measurement);
        if (this.measurements.length > 2000) {
            this.measurements.shift();
        }
        this.onTargets?.(measurement.targets);
        this.listeners.forEach((listener) => listener(measurement));
    }

    @action
    reset(): void {
        this.pending?.reject(new Error('Radar-Daten wurden zurückgesetzt.'));
        this.pending = undefined;
        this.decoder = new FrameDecoder();
        this.measurements.clear();
        this.onReset?.();
    }

    onConnectionStateChange(state: ConnectionState): void {
        if (state === 'disconnected' || state === 'error') {
            this.reading = false;
            this.initialized = false;
            this.pending?.reject(new Error('Radar-Verbindung unterbrochen.'));
            this.pending = undefined;
        }
    }

    @action
    onNewBytes(bytes: Uint8Array, timestamp: number): void {
        try {
            for (const frame of this.decoder.push(bytes)) {
                if (this.pending?.header === frame.header && this.device.isConnected) {
                    const pending = this.pending;
                    this.pending = undefined;
                    pending.resolve(frame);
                }
                if (frame.header === 'PDAT') {
                    const targets = decodeTargets(frame.payload);
                    this.publish({
                        timestamp,
                        targets,
                        source: this.device.isConnected ? 'live' : 'replay'
                    });
                }
            }
        } catch (error) {
            const failure = error instanceof Error ? error : new Error(String(error));
            this.pending?.reject(failure);
            this.pending = undefined;
            this.onError?.(failure);
            if (this.device.isConnected) {
                throw failure;
            }
            this.device.setError(failure.message);
            this.device.stopReplay(false);
        }
    }

    async connect(settings: RadarSettings): Promise<void> {
        this.stopDemo();
        settingCommands(settings);
        try {
            await this.device.connect();
            if (!this.device.isConnected) {
                throw new Error(this.device.error || 'Verbindungsaufbau abgebrochen.');
            }
            this.reading = true;
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

    private receive(header: string, send?: Uint8Array): Promise<RadarFrame> {
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
                void this.device.sendBytes(send).catch((error) => {
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
        // RESP and PDAT may share one serial chunk. Install the data waiter inside the ACK handler.
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
        void this.device.sendBytes(encodeCommand('GNFD', 4)).catch((error) => {
            this.pending?.reject(error instanceof Error ? error : new Error(String(error)));
            this.pending = undefined;
        });
        const frame = await ack;
        if (!response) {
            throw new Error(`GNFD: ${STATUS_MESSAGES[frame.payload[0]] || 'Ungültige Antwort'}`);
        }
        return decodeTargets((await response).payload);
    }

    start(
        onTargets: (targets: RadarTarget[]) => void,
        onError: (error: Error) => void,
        onReset?: () => void
    ): void {
        this.onTargets = onTargets;
        this.onError = onError;
        this.onReset = onReset;
        if (this.polling) {
            return;
        }
        this.polling = true;
        this.pollTask = (async () => {
            try {
                while (this.polling) {
                    await this.measure();
                    if (!this.polling) {
                        break;
                    }

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

    async close(): Promise<void> {
        this.stopDemo();
        await this.device.disconnect();
        this.device.stopReplay();
        this.device.unsubscribe(this.id);
        this.listeners.clear();
    }

    async disconnect(): Promise<void> {
        this.stopDemo();
        await this.device.disconnect();
    }

    async onBeforeDisconnect(): Promise<void> {
        this.polling = false;
        clearTimeout(this.pollTimer);
        this.wakePoll?.();
        await this.pollTask;
        try {
            if (this.initialized && this.reading) {
                await this.command('GBYE');
            }
        } catch {
            // Release the serial port even if the sensor does not acknowledge GBYE.
        } finally {
            this.initialized = false;
        }
    }
}
