import DistanceFilters, { DISTANCE_FILTER_SETTINGS, type DistanceRecord } from './DistanceFilters';
import type SerialBinaryDevice from '@tdev/webserial/models/SerialBinaryDevice';
import type { BinarySample } from '@tdev/webserial/models/SerialBinaryDevice';
import type { ConnectionState, iBinarySubscriber } from '@tdev/webserial/models/SerialDevice';
import type WebserialStore from '@tdev/webserial/stores/WebserialStore';
import { action, computed, observable } from 'mobx';
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
    source: 'live' | 'replay';
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
    private static instances = new WeakMap<SerialBinaryDevice, RadarDevice>();
    private resetListeners = new Set<() => void>();

    readonly measurements = observable.array<RadarMeasurement>([], { deep: false });
    private distanceRecords = observable.array<DistanceRecord>([], { deep: false });
    private filters = new DistanceFilters();
    private maxSpeed = DISTANCE_FILTER_SETTINGS.person.maxSpeedKmh / 3.6;
    private track?: { distance: number; timestamp: number; velocity: number };
    private candidate?: { distance: number; timestamp: number; count: number };
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
        const existing = this.instances.get(device);
        if (existing) {
            return existing;
        }
        const radar = new RadarDevice(device, `${id}-decoder`);
        this.instances.set(device, radar);
        return radar;
    }

    subscribe(listener: (measurement: RadarMeasurement) => void, onReset?: () => void): () => void {
        this.listeners.add(listener);
        if (onReset) {
            this.resetListeners.add(onReset);
        }
        return () => {
            this.listeners.delete(listener);
            if (onReset) {
                this.resetListeners.delete(onReset);
            }
        };
    }

    static createDemoData(range: number, count = 200): BinarySample[] {
        return Array.from({ length: count }, (_, sample) => {
            const tick = (sample + 1) * 0.12;
            const bytes = new Uint8Array(8 + 3 * 8);
            bytes.set(new TextEncoder().encode('PDAT'));
            const view = new DataView(bytes.buffer);
            view.setUint32(4, 3 * 8, true);
            for (let index = 0; index < 3; index++) {
                const offset = 8 + index * 8;
                view.setUint16(
                    offset,
                    Math.round(range * (0.24 + index * 0.2 + Math.sin(tick + index) * 0.08) * 100),
                    true
                );
                view.setInt16(offset + 2, Math.round(Math.cos(tick + index) * 200), true);
                view.setInt16(
                    offset + 4,
                    Math.round(Math.sin(tick / 3 + index * 2) * (index === 0 ? 800 : 3500)),
                    true
                );
                view.setUint16(offset + 6, (30 + index * 5) * 100, true);
            }
            return { timestamp: sample * 100, bytes };
        });
    }

    @action
    appendRecord(measurement: RadarMeasurement): void {
        const record = { ...measurement, targets: measurement.targets.map((target) => ({ ...target })) };
        this.measurements.push(record);
        const selection = this.selectDistance(record);
        this.distanceRecords.push(
            this.filters.update(selection.distance, record.timestamp, selection.reacquired)
        );
        this.onTargets?.(record.targets);
        this.listeners.forEach((listener) => listener(record));
    }

    @computed
    get targets(): RadarTarget[] {
        return this.measurements.at(-1)?.targets ?? [];
    }

    @computed
    get history(): (number | null)[] {
        return this.distanceRecords.slice(-100).map((record) => record.legacy);
    }

    getMinimumDistance(index = this.measurements.length - 1): number | null {
        return this.distanceRecords[index]?.legacy ?? null;
    }

    @computed
    get comparisonHistory(): DistanceRecord[] {
        return this.distanceRecords.slice(-100);
    }

    private selectDistance({ targets, timestamp }: RadarMeasurement): {
        distance: number | null;
        reacquired: boolean;
    } {
        const distances = targets
            .filter(
                (target) =>
                    Number.isFinite(target.angle) &&
                    Math.abs(target.angle) <= DISTANCE_FILTER_SETTINGS.person.maxAngleDegrees &&
                    Number.isFinite(target.speed) &&
                    Math.abs(target.speed) <= DISTANCE_FILTER_SETTINGS.person.maxSpeedKmh
            )
            .map((target) => target.distance)
            .filter((distance) => Number.isFinite(distance) && distance >= 0);
        if (!distances.length || !Number.isFinite(timestamp)) {
            this.candidate = undefined;
            return { distance: null, reacquired: false };
        }
        const minimum = Math.min(...distances);
        const previous = this.track;
        const elapsed = previous ? (timestamp - previous.timestamp) / 1000 : 0;
        // Reacquire the nearest object after a long gap or a restarted timestamp sequence.
        if (!previous || elapsed < 0 || elapsed > 1) {
            this.track = { distance: minimum, timestamp, velocity: 0 };
            this.candidate = undefined;
            return { distance: minimum, reacquired: true };
        }
        const predicted = previous.distance + previous.velocity * elapsed;
        // Allow 15 cm of measurement jitter plus the configured maximum travel distance.
        const tolerance = 0.15 + this.maxSpeed * elapsed;
        const plausible = distances.filter((distance) => Math.abs(distance - previous.distance) <= tolerance);
        if (!plausible.length) {
            const candidate = this.candidate;
            const candidateElapsed = candidate ? (timestamp - candidate.timestamp) / 1000 : 0;
            const consistent =
                candidate &&
                candidateElapsed >= 0 &&
                candidateElapsed <= 1 &&
                Math.abs(minimum - candidate.distance) <= 0.15 + this.maxSpeed * candidateElapsed;
            this.candidate = { distance: minimum, timestamp, count: consistent ? candidate.count + 1 : 1 };
            // An isolated jump is a gap, not an invented position. Confirm a new target over three frames.
            if (this.candidate.count < 3) {
                return { distance: null, reacquired: false };
            }
            this.track = { distance: minimum, timestamp, velocity: 0 };
            this.candidate = undefined;
            return { distance: minimum, reacquired: true };
        }
        const distance = plausible.reduce((best, value) =>
            Math.abs(value - predicted) < Math.abs(best - predicted) ? value : best
        );
        const velocity =
            elapsed > 0
                ? Math.max(-this.maxSpeed, Math.min(this.maxSpeed, (distance - previous.distance) / elapsed))
                : previous.velocity;
        this.track = { distance, timestamp, velocity: (previous.velocity + velocity) / 2 };
        this.candidate = undefined;
        return { distance, reacquired: false };
    }

    @action
    reset(): void {
        this.pending?.reject(new Error('Radar-Daten wurden zurückgesetzt.'));
        this.pending = undefined;
        this.decoder = new FrameDecoder();
        this.measurements.clear();
        this.distanceRecords.clear();
        this.filters.reset();
        this.track = undefined;
        this.candidate = undefined;
        this.onReset?.();
        this.resetListeners.forEach((listener) => listener());
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
                    this.appendRecord({
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
            await this.disconnect();
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
                        this.pollTimer = setTimeout(resolve, 5);
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
        await this.device.disconnect();
        this.device.stopReplay();
        this.device.unsubscribe(this.id);
        this.listeners.clear();
        this.resetListeners.clear();
        RadarDevice.instances.delete(this.device);
    }

    async disconnect(): Promise<void> {
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
