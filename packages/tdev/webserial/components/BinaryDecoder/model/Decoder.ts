import SerialDevice, { iSubscriber } from '@tdev/webserial/models/SerialDevice';
import { action, computed, observable } from 'mobx';

class Decoder implements iSubscriber {
    readonly id: string;
    readonly device: SerialDevice;

    private bufferOffset = 0;
    buffer = observable.array<string>([], { deep: false });
    characters = observable.array<string>([], { deep: false });

    constructor(id: string, device: SerialDevice) {
        this.id = id;
        this.device = device;
        this.device.subscribe(this);
    }

    @action
    onNewLines(lines: string[]) {
        const bits = lines.map((l) => l.trim()).filter((l) => l === '0' || l === '1');
        this.buffer.push(...bits);
        while (this.buffer.length - this.bufferOffset >= 8) {
            const byte = this.buffer.slice(this.bufferOffset, this.bufferOffset + 8).join('');
            const charCode = parseInt(byte, 2);
            if (!isNaN(charCode)) {
                this.characters.push(String.fromCharCode(charCode));
            }
            this.bufferOffset += 8;
        }
    }

    @action
    reset() {
        this.buffer.clear();
        this.characters.clear();
        this.bufferOffset = 0;
    }

    @computed
    get isProcessing(): boolean {
        return this.buffer.length % 8 !== 0;
    }

    /**
     * Returns the number of complete bytes in the buffer
     */
    @computed
    get size(): number {
        return Math.ceil(this.buffer.length / 8);
    }

    @computed
    get text(): string {
        return this.characters.join('');
    }

    @computed
    get lines(): string[] {
        return this.text.split('\n');
    }

    @action
    cleanup() {
        this.device.unsubscribe(this.id);
    }
}

export default Decoder;
