import { action, computed, observable } from 'mobx';
import WebserialStore from '../stores/WebserialStore';
import { Hashery } from 'hashery';
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
}

const DEFAULT_CONFIG: Config = {
    resetTrigger: undefined,
    dataBufferSize: 20000
};

export interface iSubscriber {
    id: string;
    /**
     * called when a complete line (ending with a newline) is received from the serial device.
     */
    onNewLines: (newLines: string[]) => void;
    /**
     * called when the reset trigger is received or when the replay is reset/started.
     * Subscribers should clear any state that depends on the received lines when this is called.
     */
    reset: () => void;
    /**
     * called when the connection state changes (e.g. from 'connected' to 'disconnected').
     */
    onConnectionStateChange?: (state: ConnectionState) => void;
}

export default class SerialDevice {
    readonly webserialStore: WebserialStore;
    readonly serialOptions: SerialOptions;
    readonly config: Config;
    private lineBuffer: string = '';
    private subscriptions = new Map<string, iSubscriber>();

    @observable accessor connectionState: ConnectionState = 'disconnected';
    @observable accessor error: string | null = null;
    @observable accessor inputValue: string = '';

    @observable accessor isProcessing = false;
    @observable accessor _replayInterval: NodeJS.Timeout | null = null;
    @observable accessor replaySpeed: number = 250;
    @observable accessor _replayPausedAt: number = 0;
    _replayPristineData: string[] = [];
    _isProcessingCounterTimeout: NodeJS.Timeout | null = null;

    receivedData = observable.array<string>([]);

    private port: SerialPort | null = null;
    private reader: ReadableStreamDefaultReader<string> | null = null;
    private readableStreamClosed: Promise<void> | null = null;
    private writableStreamClosed: Promise<void> | null = null;
    private writer: WritableStreamDefaultWriter<string> | null = null;
    private abortController: AbortController | null = null;

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
    setReplayData(data: string[]) {
        this.stopReplay();
        this.receivedData.replace(data);
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
        this.lineBuffer = '';
        for (const subscriber of this.subscriptions.values()) {
            subscriber.reset();
        }
        if (currentData.length > 0) {
            this.appendReceivedData(currentData.join('\n') + '\n');
        }
        let i = 0;
        this._replayInterval = setInterval(() => {
            if (i < data.length) {
                this.appendReceivedData(data[i] + '\n');
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
            this.appendReceivedData(this._replayPristineData[0] + '\n');
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
    stopReplay() {
        if (this._replayInterval) {
            clearInterval(this._replayInterval);
            this._replayInterval = null;
        }
        if (this._replayPristineData.length > 0) {
            const currentDataHash = hasher.toHashSync(this.receivedData);
            const pristineDataHash = hasher.toHashSync(this._replayPristineData);
            if (currentDataHash !== pristineDataHash) {
                this.receivedData.replace(this._replayPristineData);
                for (const subscriber of this.subscriptions.values()) {
                    subscriber.reset();
                    subscriber.onNewLines(this.receivedData.slice());
                }
            }
            this._replayPristineData = [];
        }
        this._replayPausedAt = 0;
    }

    @action
    subscribe(subscriber: iSubscriber) {
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

    @action
    appendReceivedData(data: string) {
        const lines = data.replaceAll(/\r/g, '').split('\n');
        const [first, ...rest] = lines;
        this.setIsProcessing(true);
        if (first === undefined) {
            return;
        }
        const last = rest.splice(-1)[0];
        const currentLine = this.size;
        if (this.lineBuffer.length > 0) {
            this.lineBuffer += first;
        } else {
            this.lineBuffer = first;
        }
        if (this.lineBuffer.length > 0 && last === undefined) {
            return;
        }
        if (last !== undefined) {
            this.receivedData.push(this.lineBuffer);
        }
        this.receivedData.push(...rest);
        this.lineBuffer = last ?? '';
        const addedLines = this.receivedData.slice(currentLine);
        if (addedLines.length > 0) {
            for (const subscriber of this.subscriptions.values()) {
                subscriber.onNewLines(addedLines);
            }
        }

        if (this.config.resetTrigger && addedLines.some((l) => l.trim() === this.config.resetTrigger)) {
            return this.clearReceivedData();
        }
        // Keep a rolling buffer of last 1000 entries
        if (this.size > this.config.dataBufferSize && this.config.dataBufferSize > 0) {
            this.receivedData.replace(this.receivedData.slice(-Math.ceil(this.config.dataBufferSize / 2)));
        }
    }

    @action
    clearReceivedData() {
        this.stopReplay();
        this.receivedData.clear();
        this.lineBuffer = '';
        for (const subscriber of this.subscriptions.values()) {
            subscriber.reset();
        }
        this.isProcessing = false;
        if (this._isProcessingCounterTimeout) {
            clearTimeout(this._isProcessingCounterTimeout);
            this._isProcessingCounterTimeout = null;
        }
    }

    /**
     * Prompts the user to select a serial port and opens the connection.
     */
    async connect(): Promise<void> {
        if (this.isConnected) {
            return;
        }
        this.clearReceivedData();

        try {
            this.setConnectionState('connecting');
            this.setError(null);

            // Prompt user to select a port
            const port = await navigator.serial.requestPort();
            this.port = port;

            // If the port is already open (e.g. from a previous session that didn't
            // close properly), try to close it first before reopening.
            if (port.readable || port.writable) {
                try {
                    await port.close();
                } catch {
                    // Ignore — we'll try to open anyway
                }
            }

            // Open the port (retry once after a short delay if it fails)
            try {
                await port.open(this.serialOptions);
            } catch (openErr: any) {
                if (openErr.name === 'InvalidStateError' || openErr.name === 'NetworkError') {
                    // Port may still be releasing — wait and retry once
                    await new Promise((r) => setTimeout(r, 1000));
                    await port.open(this.serialOptions);
                } else {
                    throw openErr;
                }
            }

            window.addEventListener('beforeunload', () => {
                if (this.port) {
                    this.cleanup();
                }
            });

            this.abortController = new AbortController();

            // Set up the text decoder stream for reading
            const textDecoder = new TextDecoderStream();
            this.readableStreamClosed = port.readable!.pipeTo(
                textDecoder.writable as WritableStream<Uint8Array<ArrayBufferLike>>,
                {
                    signal: this.abortController.signal
                }
            );
            this.reader = textDecoder.readable.getReader();

            // Set up the text encoder stream for writing
            const textEncoder = new TextEncoderStream();
            this.writableStreamClosed = textEncoder.readable.pipeTo(port.writable!);
            this.writer = textEncoder.writable.getWriter();

            this.setConnectionState('connected');

            // Start the read loop
            this.readLoop();

            // Listen for disconnect
            port.addEventListener('disconnect', this.handleDisconnect);
        } catch (err: any) {
            // User cancelled the dialog or an error occurred
            if (err.name === 'NotFoundError') {
                // User cancelled — just go back to disconnected
                this.setConnectionState('disconnected');
            } else {
                this.setError(err.message ?? 'Unknown error');
                this.setConnectionState('error');
                // Release the port so it can be opened next time
                if (this.port) {
                    try {
                        await this.port.close();
                    } catch {
                        // Ignore
                    }
                }
            }
            this.port = null;
        }
    }

    /**
     * Sends a string to the connected serial device.
     */
    async send(data: string): Promise<void> {
        if (!this.writer || !this.isConnected) {
            throw new Error('Not connected to a serial device.');
        }
        await this.writer.write(data);
    }

    /**
     * Sends a line (string + newline) to the connected serial device.
     */
    async sendLine(data: string): Promise<void> {
        await this.send(data + '\n');
    }

    @computed
    get portName(): number {
        return this.port?.getInfo().usbProductId || -1;
    }

    /**
     * Disconnects from the serial port.
     */
    async disconnect(): Promise<void> {
        if (!this.port) {
            return;
        }
        return this.cleanup();
    }

    private handleDisconnect = action(() => {
        this.cleanup();
    });

    @action
    private async cleanup() {
        const port = this.port;
        const reader = this.reader;
        const writer = this.writer;
        const abortController = this.abortController;
        const readableStreamClosed = this.readableStreamClosed;
        const writableStreamClosed = this.writableStreamClosed;

        // Null out references immediately so no further reads/writes happen
        this.port = null;
        this.reader = null;
        this.writer = null;
        this.abortController = null;
        this.readableStreamClosed = null;
        this.writableStreamClosed = null;
        this.setConnectionState('disconnected');
        this.setError(null);

        if (port) {
            port.removeEventListener('disconnect', this.handleDisconnect);
        }

        // Async cleanup — must follow the correct order to release OS handles:
        //   1. Abort the readable pipeTo  → releases lock on port.readable
        //   2. Close the writer            → releases lock on port.writable
        //   3. Close the port              → releases OS serial handle
        // Getting this order wrong leaves port.readable locked, so port.close()
        // silently fails to release the OS handle and the next open() errors.
        try {
            // 1. Abort the pipeTo so port.readable is cancelled & unlocked.
            //    The in-flight reader.read() in readLoop will reject (AbortError)
            //    and the loop will exit.
            if (abortController) {
                abortController.abort();
            }
            await readableStreamClosed?.catch(() => {});

            // The reader's lock on textDecoder.readable can now be released.
            if (reader) {
                try {
                    reader.releaseLock();
                } catch {
                    // Already released
                }
            }

            // 2. Close the writer so port.writable is unlocked.
            if (writer) {
                try {
                    await writer.close();
                } catch {
                    // Already closed
                }
                try {
                    writer.releaseLock();
                } catch {
                    // Already released
                }
            }
            await writableStreamClosed?.catch(() => {});

            // 3. Both streams are unlocked — safe to close the port.
            if (port) {
                try {
                    await port.close();
                } catch {
                    // Port already closed or device removed
                }
            }
        } catch (err) {
            console.warn('Error during serial cleanup:', err);
        }
    }

    private async readLoop(): Promise<void> {
        while (this.reader && this.isConnected) {
            try {
                const { value, done } = await this.reader.read();
                if (done) {
                    break;
                }
                if (value) {
                    this.appendReceivedData(value);
                }
            } catch (err: any) {
                // Stream was cancelled (disconnect) or device was removed
                if (err.name === 'AbortError') {
                    // Normal disconnect flow — handleDisconnect or disconnect() handles cleanup
                    break;
                }
                if (err.name === 'NetworkError') {
                    // Device was physically removed — trigger full cleanup
                    console.warn('Serial device was physically removed.');
                    this.cleanup();
                    break;
                }
                console.warn('Unexpected serial read error:', err);
                this.cleanup();
                break;
            }
        }
    }
}
