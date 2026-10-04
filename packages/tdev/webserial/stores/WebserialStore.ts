import type ViewStore from '@tdev-stores/ViewStores/index';
import { action, computed, observable } from 'mobx';
import type { Config, SerialOptions } from '../models/SerialDeviceBase';
import SerialTextDevice from '../models/SerialTextDevice';
import SerialBinaryDevice from '../models/SerialBinaryDevice';

export default class WebserialStore {
    readonly viewStore: ViewStore;
    devices = observable.map<string, SerialTextDevice | SerialBinaryDevice>([], { deep: false });

    constructor(viewStore: ViewStore) {
        this.viewStore = viewStore;
    }

    useDevice(id: string, options?: Partial<SerialOptions>, config?: Partial<Config>): SerialTextDevice {
        const existing = this.devices.get(id);
        if (existing) {
            if (!(existing instanceof SerialTextDevice)) {
                throw new Error(`Device ${id} is already used in binary mode.`);
            }
            return existing;
        }
        const device = new SerialTextDevice(options ?? {}, config ?? {}, this);
        this.devices.set(id, device);
        return device;
    }

    useBinaryDevice(
        id: string,
        options?: Partial<SerialOptions>,
        config?: Partial<Config>
    ): SerialBinaryDevice {
        const existing = this.devices.get(id);
        if (existing) {
            if (!(existing instanceof SerialBinaryDevice)) {
                throw new Error(`Device ${id} is already used in text mode.`);
            }
            for (const [key, value] of Object.entries(options ?? {})) {
                if (existing.serialOptions[key as keyof SerialOptions] !== value) {
                    throw new Error(`Device ${id} has conflicting serial option ${key}.`);
                }
            }
            return existing;
        }
        const device = new SerialBinaryDevice(options ?? {}, { dataBufferSize: 0, ...config }, this);
        this.devices.set(id, device);
        return device;
    }

    @action
    async disconnectDevice(id: string): Promise<void> {
        const device = this.devices.get(id);
        if (device) {
            await device.disconnect();
        }
    }

    @action
    async clearDevice(id: string): Promise<void> {
        await this.disconnectDevice(id);
        this.devices.get(id)?.clearReceivedData();
        this.devices.delete(id);
    }

    @computed
    get isSupported(): boolean {
        return typeof navigator !== 'undefined' && 'serial' in navigator;
    }
}
