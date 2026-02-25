import { action, computed, observable } from 'mobx';
import ViewStore from '@tdev-stores/ViewStores/index';

export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface SerialOptions {
    baudRate: number;
    dataBits?: 7 | 8;
    stopBits?: 1 | 2;
    parity?: 'none' | 'even' | 'odd';
    bufferSize?: number;
    flowControl?: 'none' | 'hardware';
    clearReceivedDataOnString?: string;
}

const DEFAULT_SERIAL_OPTIONS: SerialOptions = {
    baudRate: 115200,
    dataBits: 8,
    stopBits: 1,
    parity: 'none',
    bufferSize: 255,
    flowControl: 'none',
    clearReceivedDataOnString: '::READY::'
};

export default class WebserialStore {
    readonly viewStore: ViewStore;

    @observable accessor connectionState: ConnectionState = 'disconnected';
    @observable accessor error: string | null = null;
    @observable.ref accessor serialOptions: SerialOptions = { ...DEFAULT_SERIAL_OPTIONS };

    receivedData = observable.array<string>([]);

    private port: SerialPort | null = null;
    private reader: ReadableStreamDefaultReader<string> | null = null;
    private readableStreamClosed: Promise<void> | null = null;
    private writableStreamClosed: Promise<void> | null = null;
    private writer: WritableStreamDefaultWriter<string> | null = null;
    private abortController: AbortController | null = null;

    constructor(viewStore: ViewStore) {
        this.viewStore = viewStore;
    }

    @computed
    get isConnected(): boolean {
        return this.connectionState === 'connected';
    }

    @computed
    get isSupported(): boolean {
        return 'serial' in navigator;
    }

    @action
    setConnectionState(state: ConnectionState) {
        this.connectionState = state;
    }

    @action
    setError(error: string | null) {
        this.error = error;
    }

    @action
    setSerialOptions(options: Partial<SerialOptions>) {
        this.serialOptions = { ...this.serialOptions, ...options };
    }

    @action
    appendReceivedData(data: string) {
        if (
            this.serialOptions.clearReceivedDataOnString &&
            data.trim() === this.serialOptions.clearReceivedDataOnString
        ) {
            this.clearReceivedData();
            return;
        }
        this.receivedData.push(data);
        // Keep a rolling buffer of last 1000 entries
        if (this.receivedData.length > 1000) {
            this.receivedData.replace(this.receivedData.slice(-500));
        }
    }

    @action
    clearReceivedData() {
        this.receivedData.clear();
    }

    /**
     * Prompts the user to select a serial port and opens the connection.
     */
    async connect(options?: Partial<SerialOptions>): Promise<void> {
        if (!this.isSupported) {
            this.setError('Web Serial API is not supported in this browser.');
            this.setConnectionState('error');
            return;
        }

        if (this.isConnected) {
            return;
        }

        const mergedOptions = { ...this.serialOptions, ...(options ?? {}) };

        // Strip out custom options that are not part of the Web Serial API's SerialOptions
        const { clearReceivedDataOnString, ...nativeSerialOptions } = mergedOptions;

        try {
            this.setConnectionState('connecting');
            this.setError(null);

            // Prompt user to select a port
            const port = await navigator.serial.requestPort();
            this.port = port;

            // Open the port with only native serial options
            await port.open(nativeSerialOptions);

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

    /**
     * Disconnects from the serial port.
     */
    async disconnect(): Promise<void> {
        if (!this.port) {
            return;
        }
        this.cleanup();
    }

    private handleDisconnect = action(() => {
        console.log('Serial device was disconnected.');
        this.cleanup();
    });

    @action
    private cleanup() {
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

        // Async cleanup — release locks, then close port
        (async () => {
            try {
                // Cancel the reader to release the lock on readable
                if (reader) {
                    try {
                        await reader.cancel();
                    } catch {
                        // Already cancelled
                    }
                    try {
                        reader.releaseLock();
                    } catch {
                        // Already released
                    }
                }

                // Abort the pipeTo to release the readable stream
                if (abortController) {
                    try {
                        abortController.abort();
                    } catch {
                        // Already aborted
                    }
                }
                await readableStreamClosed?.catch(() => {});

                // Close the writer to release the lock on writable
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

                // Now the streams are unlocked — safe to close the port
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
        })();
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
