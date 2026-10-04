import { useEffect, useMemo, useRef } from 'react';
import { useStore } from '@tdev-hooks/useStore';
import '@tdev/webserial';
import RadarDevice from '../models/RadarDevice';

export default function useRadarDevice(deviceId: string): RadarDevice {
    const viewStore = useStore('viewStore');
    const store = viewStore.useStore('webserialStore');
    const radar = useMemo(() => RadarDevice.request(store, deviceId), [store, deviceId]);
    const pendingCleanup = useRef<{ radar: RadarDevice; timer: ReturnType<typeof setTimeout> } | undefined>(
        undefined
    );

    useEffect(() => {
        if (pendingCleanup.current?.radar === radar) {
            clearTimeout(pendingCleanup.current.timer);
            pendingCleanup.current = undefined;
        }
        return () => {
            // Defer disposal so React StrictMode's effect restart reuses the same controller.
            // A different device ID must still dispose its previous controller.
            pendingCleanup.current = {
                radar,
                timer: setTimeout(() => {
                    void radar.close().then(() => store.clearDevice(deviceId));
                }, 0)
            };
        };
    }, [radar, store, deviceId]);

    return radar;
}
