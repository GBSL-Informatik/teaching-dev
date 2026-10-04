import { useEffect, useMemo } from 'react';
import { useStore } from '@tdev-hooks/useStore';
import '@tdev/webserial';
import RadarDevice from '../models/RadarDevice';

const consumers = new WeakMap<RadarDevice, { count: number; cleanup?: ReturnType<typeof setTimeout> }>();

export default function useRadarDevice(deviceId: string): RadarDevice {
    const viewStore = useStore('viewStore');
    const store = viewStore.useStore('webserialStore');
    const radar = useMemo(() => RadarDevice.request(store, deviceId), [store, deviceId]);

    useEffect(() => {
        const entry = consumers.get(radar) ?? { count: 0 };
        consumers.set(radar, entry);
        clearTimeout(entry.cleanup);
        entry.count++;
        return () => {
            entry.count--;
            if (entry.count === 0) {
                // Defer disposal so React StrictMode's effect restart reuses the same controller.
                entry.cleanup = setTimeout(() => {
                    void radar.close().then(() => store.clearDevice(deviceId));
                    consumers.delete(radar);
                }, 0);
            }
        };
    }, [radar, store, deviceId]);

    return radar;
}
