import { action, computed, observable } from 'mobx';
import ViewStore from '@tdev-stores/ViewStores/index';
import SerialDevice, { Config } from '../models/SerialDevice';

export default class WebserialStore {
    readonly viewStore: ViewStore;
    devices = observable.map<string, SerialDevice>([], { deep: false });

    constructor(viewStore: ViewStore) {
        this.viewStore = viewStore;
    }

    useDevice(id: string, options?: Partial<SerialOptions>, config?: Partial<Config>): SerialDevice {
        if (this.devices.has(id)) {
            return this.devices.get(id)!;
        }
        const device = new SerialDevice(options ?? {}, config ?? {}, this);
        this.devices.set(id, device);
        return device;
    }

    @action
    async disconnectDevice(id: string): Promise<void> {
        const device = this.devices.get(id);
        if (device) {
            // this.devices.set(id, new SerialDevice(device.serialOptions, device.config, this));
            await device.disconnect();
        }
    }

    @action
    async clearDevice(id: string): Promise<void> {
        await this.disconnectDevice(id);
        this.devices.delete(id);
    }

    @computed
    get isSupported(): boolean {
        return 'serial' in navigator;
    }
}
