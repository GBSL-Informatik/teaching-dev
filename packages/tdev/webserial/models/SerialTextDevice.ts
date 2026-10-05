import { action } from 'mobx';
import SerialDevice, { type iSubscriber } from './SerialDeviceBase';

export default class SerialTextDevice extends SerialDevice<string, iSubscriber> {
    private lineBuffer = '';
    private decoder = new TextDecoder();

    protected receiveBytes(bytes: Uint8Array): void {
        this.appendReceivedData(this.decoder.decode(bytes, { stream: true }));
    }

    protected resetDecoder(): void {
        this.lineBuffer = '';
        this.decoder = new TextDecoder();
    }

    protected notify(value: string): void {
        this.subscriptions.forEach((subscriber) => subscriber.onNewLines([value]));
    }

    protected deliver(value: string): void {
        this.appendReceivedData(value + '\n');
    }

    async send(data: string): Promise<void> {
        await this.writeBytes(new TextEncoder().encode(data));
    }
    async sendLine(data: string): Promise<void> {
        await this.send(data + '\n');
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
}
