/// <reference types="w3c-web-serial" />

import { Hashery } from 'hashery';
import { action, computed, observable } from 'mobx';
import type WebserialStore from '../stores/WebserialStore';
const hasher = new Hashery({ cache: { enabled: false } });

export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface SerialOptions {
    baudRate: number;
    dataBits?: 7 | 8;
    stopBits?: 1 | 2;
    parity?: 'none' | 'even' | 'odd';
    bufferSize?: number;
    flowControl?: 'none' | 'hardware';
}

const DEFAULT_SERIAL_OPTIONS: SerialOptions = {
    baudRate: 115200,
    dataBits: 8,
    stopBits: 1,
    parity: 'none',
    bufferSize: 255,
    flowControl: 'none'
};

export interface Config {
    resetTrigger: string | undefined;
    dataBufferSize: number;
    portFilters?: SerialPortFilter[];
}

const DEFAULT_CONFIG: Config = {
    resetTrigger: undefined,
    dataBufferSize: 20000
};

export interface Subscriber {
    id: string;
    reset: () => void;
    onConnectionStateChange?: (state: ConnectionState) => void;
    onBeforeDisconnect?: () => Promise<void>;
}

export interface iSubscriber extends Subscriber {
    onNewLines: (newLines: string[]) => void;
}

export interface iBinarySubscriber extends Subscriber {
    onNewBytes: (bytes: Uint8Array, timestamp: number) => void;
}

export default abstract class SerialDevice<T, S extends Subscriber> {
    readonly webserialStore: WebserialStore;
    readonly serialOptions: SerialOptions;
    readonly config: Config;
    protected subscriptions = new Map<string, S>();

    @observable accessor connectionState: ConnectionState = 'disconnected';
    @observable accessor error: string | null = null;
    @observable accessor inputValue: string = '';

    @observable accessor isProcessing = false;
    @observable accessor _replayInterval: NodeJS.Timeout | null = null;
    @observable accessor replaySpeed: number = 250;
    @observable accessor _replayPausedAt: number = 0;
    _replayPristineData: T[] = [];
    _isProcessingCounterTimeout: NodeJS.Timeout | null = null;

    receivedData = observable.array<T>([], { deep: false });

    private port: SerialPort | null = null;
    private reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
    private writer: WritableStreamDefaultWriter<Uint8Array> | null = null;
    private connectionTask?: Promise<void>;
    private cleanupTask?: Promise<void>;
    private generation = 0;
    private opened = false;

    protected abstract receiveBytes(bytes: Uint8Array): void;
    protected abstract deliver(value: T): void;
    protected clone(value: T): T {
        return value;
    }
    protected resetDecoder(): void {}

    constructor(options: Partial<SerialOptions>, config: Partial<Config>, webserialStore: WebserialStore) {
        this.serialOptions = { ...DEFAULT_SERIAL_OPTIONS, ...options };
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.webserialStore = webserialStore;
    }

    @computed
    get size(): number {
        return this.receivedData.length;
    }

    @computed
    get canReplay(): boolean {
        return !this.isConnected && this.size > 0;
    }

    @computed
    get isReplaying(): boolean {
        return this._replayInterval !== null;
    }

    @computed
    get isReplayPaused(): boolean {
        return this._replayPausedAt > 0;
    }

    @action
    setReplayData(data: T[]) {
        this.stopReplay();
        this.receivedData.replace(data.map((value) => this.clone(value)));
    }

    @action
    replay(from: number = 0) {
        if (this.isConnected) {
            return;
        }
        this.stopReplay();
        this._replayPristineData = this.receivedData.slice();
        const data = this.receivedData.slice(from);
        const currentData = this.receivedData.slice(0, from);
        this.receivedData.clear();
        this.resetDecoder();
        for (const subscriber of this.subscriptions.values()) {
            subscriber.reset();
        }
        if (currentData.length > 0) {
            currentData.forEach((value) => this.deliver(value));
        }
        let i = 0;
        this._replayInterval = setInterval(() => {
            if (i < data.length) {
                this.deliver(data[i]);
                i++;
            } else {
                this.stopReplay();
            }
        }, this.replaySpeed);
    }

    @action
    pauseReplay() {
        if (!this.isReplaying || this._replayPristineData.length === 0) {
            return;
        }
        // this happens only on double-clicking the replay button.
        // ensure at least one data entry was received.
        if (this.size === 0) {
            this.deliver(this._replayPristineData[0]);
        }
        this._replayPausedAt = this.size;
        if (this._replayInterval) {
            clearInterval(this._replayInterval);
            this._replayInterval = null;
        }
    }

    @action
    setReplaySpeed(speed: number) {
        this.replaySpeed = speed;
        if (this.isReplaying) {
            this.pauseReplay();
            this.replay(this._replayPausedAt);
        }
    }

    @action
    stopReplay(notifySubscribers = true) {
        if (this._replayInterval) {
            clearInterval(this._replayInterval);
            this._replayInterval = null;
        }
        if (this._replayPristineData.length > 0) {
            const currentDataHash = hasher.toHashSync(this.receivedData);
            const pristineDataHash = hasher.toHashSync(this._replayPristineData);
            if (currentDataHash !== pristineDataHash) {
                this.receivedData.replace(this._replayPristineData);
                this.resetDecoder();
                if (notifySubscribers) {
                    for (const subscriber of this.subscriptions.values()) {
                        subscriber.reset();
                    }
                    this.receivedData.forEach((value) => this.notify(value));
                }
            }
            this._replayPristineData = [];
        }
        this._replayPausedAt = 0;
    }

    @action
    subscribe(subscriber: S) {
        this.subscriptions.set(subscriber.id, subscriber);
    }

    @action
    unsubscribe(id: string) {
        this.subscriptions.delete(id);
    }

    @computed
    get isConnected(): boolean {
        return this.connectionState === 'connected';
    }

    @action
    setInputValue(value: string) {
        this.inputValue = value;
    }

    @action
    setConnectionState(state: ConnectionState) {
        this.connectionState = state;
        for (const subscriber of this.subscriptions.values()) {
            subscriber.onConnectionStateChange?.(state);
        }
    }

    @action
    setError(error: string | null) {
        this.error = error;
    }

    @action
    setIsProcessing(isProcessing: boolean) {
        this.isProcessing = isProcessing;
        if (isProcessing) {
            if (this._isProcessingCounterTimeout) {
                clearTimeout(this._isProcessingCounterTimeout);
            }
            this._isProcessingCounterTimeout = setTimeout(() => {
                this.setIsProcessing(false);
            }, 2000);
        }
    }

    protected abstract notify(value: T): void;

    @action
    protected record(value: T): void {
        this.receivedData.push(this.clone(value));
        this.setIsProcessing(true);
        this.notify(value);
        if (!this.isReplaying && this.config.dataBufferSize > 0 && this.size > this.config.dataBufferSize) {
            this.receivedData.replace(this.receivedData.slice(-Math.ceil(this.config.dataBufferSize / 2)));
        }
    }

    @action
    clearReceivedData(): void {
        this.stopReplay();
        this.receivedData.clear();
        this.resetDecoder();
        this.subscriptions.forEach((subscriber) => subscriber.reset());
        this.isProcessing = false;
        if (this._isProcessingCounterTimeout) {
            clearTimeout(this._isProcessingCounterTimeout);
        }
        this._isProcessingCounterTimeout = null;
    }

    connect(): Promise<void> {
        if (this.cleanupTask) {
            return this.cleanupTask.then(() => this.connect());
        }
        if (this.isConnected) {
            return Promise.resolve();
        }
        if (!this.connectionTask) {
            this.connectionTask = this.openPort().finally(() => {
                this.connectionTask = undefined;
            });
        }
        return this.connectionTask;
    }

    private async openPort(): Promise<void> {
        await this.cleanupTask;
        const generation = ++this.generation;
        this.clearReceivedData();
        this.setConnectionState('connecting');
        this.setError(null);
        try {
            const port = await navigator.serial.requestPort(
                this.config.portFilters ? { filters: this.config.portFilters } : undefined
            );
            if (generation !== this.generation) {
                return;
            }
            this.port = port;
            try {
                await port.open(this.serialOptions);
            } catch (error) {
                if (
                    !(error instanceof Error) ||
                    !['InvalidStateError', 'NetworkError'].includes(error.name)
                ) {
                    throw error;
                }
                await new Promise((resolve) => setTimeout(resolve, 1000));
                if (generation !== this.generation) {
                    return;
                }
                await port.open(this.serialOptions);
            }
            if (generation !== this.generation) {
                await port.close().catch(() => {});
                return;
            }
            this.opened = true;
            if (!port.readable || !port.writable) {
                throw new Error('Serial port has no readable/writable streams.');
            }
            this.reader = port.readable.getReader();
            this.writer = port.writable.getWriter();
            port.addEventListener('disconnect', this.handleDisconnect);
            window.addEventListener('beforeunload', this.handleUnload);
            this.setConnectionState('connected');
            void this.readLoop();
        } catch (error) {
            const failure = error instanceof Error ? error : new Error(String(error));
            await this.cleanup();
            if (failure.name !== 'NotFoundError') {
                this.setError(failure.message);
                this.setConnectionState('error');
            }
        }
    }

    protected async writeBytes(bytes: Uint8Array): Promise<void> {
        if (!this.writer || !this.isConnected) {
            throw new Error('Not connected to a serial device.');
        }
        await this.writer.write(bytes);
    }

    @computed
    get portName(): number {
        return this.port?.getInfo().usbProductId || -1;
    }

    disconnect(): Promise<void> {
        if (!this.cleanupTask) {
            this.cleanupTask = (async () => {
                try {
                    if (this.isConnected) {
                        for (const subscriber of this.subscriptions.values()) {
                            await subscriber.onBeforeDisconnect?.();
                        }
                    }
                } finally {
                    await this.cleanup();
                }
            })().finally(() => {
                this.cleanupTask = undefined;
            });
        }
        return this.cleanupTask;
    }

    private handleDisconnect = () => {
        void this.cleanup();
    };
    private handleUnload = () => {
        void this.cleanup();
    };

    private async cleanup(): Promise<void> {
        ++this.generation;
        const port = this.port;
        const reader = this.reader;
        const writer = this.writer;
        const opened = this.opened;
        this.port = null;
        this.reader = null;
        this.writer = null;
        this.opened = false;
        port?.removeEventListener('disconnect', this.handleDisconnect);
        window.removeEventListener('beforeunload', this.handleUnload);
        this.setConnectionState('disconnected');
        if (reader) {
            await reader.cancel().catch(() => {});
            reader.releaseLock();
        }
        writer?.releaseLock();
        if (port && opened) {
            await port.close().catch(() => {});
        }
    }

    private async readLoop(): Promise<void> {
        const reader = this.reader;
        while (reader && reader === this.reader && this.isConnected) {
            try {
                const { value, done } = await reader.read();
                if (reader !== this.reader) {
                    break;
                }
                if (done) {
                    await this.cleanup();
                    break;
                }
                if (value) {
                    this.receiveBytes(value);
                }
            } catch (error) {
                if (reader !== this.reader) {
                    break;
                }
                await this.cleanup();
                this.setError(error instanceof Error ? error.message : String(error));
                this.setConnectionState('error');
                break;
            }
        }
    }
}
