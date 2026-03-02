import SerialDevice, { iSubscriber } from '@tdev/webserial/models/SerialDevice';
import { action, computed, observable } from 'mobx';

class Decoder implements iSubscriber {
    readonly id: string;
    readonly device: SerialDevice;

    buffer = observable.array<'0' | '1'>([], { deep: false });
    bytes = observable.array<string>([], { deep: false });
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
        while (this.buffer.length >= 8) {
            const byte = this.buffer.splice(0, 8).join('');
            this.bytes.push(byte);
            const charCode = parseInt(byte, 2);
            if (!isNaN(charCode)) {
                this.characters.push(String.fromCharCode(charCode));
            }
        }
    }

    @action
    reset() {
        this.buffer.clear();
        this.bytes.clear();
        this.characters.clear();
    }

    /**
     * Returns the number of complete bytes in the buffer
     */
    @computed
    get size(): number {
        return this.bytes.length;
    }

    @computed
    get bitSize(): number {
        return this.buffer.length + this.size * 8;
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
