import { action } from 'mobx';
import SerialDevice, { type iBinarySubscriber } from './SerialDeviceBase';

export interface BinarySample {
    timestamp: number;
    bytes: Uint8Array;
}

export default class SerialBinaryDevice extends SerialDevice<BinarySample, iBinarySubscriber> {
    @action
    override subscribe(subscriber: iBinarySubscriber): void {
        const existing = this.subscriptions.get(subscriber.id);
        if (existing && existing !== subscriber) {
            throw new Error(`Subscriber ${subscriber.id} is already registered.`);
        }
        super.subscribe(subscriber);
    }

    protected receiveBytes(bytes: Uint8Array): void {
        this.appendReceivedData({ timestamp: Date.now(), bytes });
    }

    protected clone(value: BinarySample): BinarySample {
        return { timestamp: value.timestamp, bytes: value.bytes.slice() };
    }

    protected notify(value: BinarySample): void {
        this.subscriptions.forEach((subscriber) =>
            subscriber.onNewBytes(value.bytes.slice(), value.timestamp)
        );
    }

    protected deliver(value: BinarySample): void {
        this.appendReceivedData(value);
    }

    @action
    appendReceivedData(value: BinarySample): void {
        this.record(value);
    }

    async sendBytes(bytes: Uint8Array): Promise<void> {
        await this.writeBytes(bytes);
    }
}
