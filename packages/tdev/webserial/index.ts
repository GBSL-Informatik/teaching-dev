import type WebserialStore from './stores/WebserialStore';

declare module '@tdev-api/document' {
    export interface ViewStoreTypeMapping {
        ['webserialStore']: WebserialStore;
    }
}

export { default as SerialDevice } from './models/SerialDeviceBase';
export { default as SerialTextDevice } from './models/SerialTextDevice';
export { default as SerialBinaryDevice } from './models/SerialBinaryDevice';
export type {
    ConnectionState,
    Config,
    SerialOptions,
    iSubscriber,
    iBinarySubscriber
} from './models/SerialDeviceBase';
export type { BinarySample } from './models/SerialBinaryDevice';
