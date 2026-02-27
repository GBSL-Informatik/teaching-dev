import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import { useStore } from '@tdev-hooks/useStore';
import Logs from '@tdev-components/documents/CodeEditor/Editor/Footer/Logs';
import { FullscreenContext } from '@tdev-hooks/useFullscreenTargetId';

interface Props {
    /** Override default baud rate (default: 115200) */
    baudRate?: number;
    deviceId?: string;
}

const Webserial = observer((props: Props) => {
    const defaultId = React.useId();
    const { baudRate, deviceId } = props;
    const viewStore = useStore('viewStore');
    const webserialStore = viewStore.useStore('webserialStore');
    const device = webserialStore.useDevice(deviceId ?? defaultId, baudRate ? { baudRate } : {}, {
        onReadyString: '::READY::'
    });

    const handleConnect = async () => {
        await device.connect();
    };

    const handleDisconnect = async () => {
        await webserialStore.disconnectDevice(deviceId ?? defaultId);
    };

    React.useEffect(() => {
        return () => {
            webserialStore.clearDevice(deviceId ?? defaultId);
        };
    }, [deviceId]);

    if (!device) {
        return null;
    }

    return (
        <FullscreenContext.Provider value={'webserial'}>
            <div className={clsx(styles.Webserial)}>
                <div className={clsx(styles.toolbar)}>
                    {!webserialStore.isSupported && (
                        <p className={clsx(styles.warning)}>
                            ⚠️ Web Serial API is not supported in this browser. Use Chrome or Edge.
                        </p>
                    )}

                    {webserialStore.isSupported && !device.isConnected && (
                        <button
                            className={clsx(styles.connectButton)}
                            onClick={handleConnect}
                            disabled={device.connectionState === 'connecting'}
                        >
                            {device.connectionState === 'connecting'
                                ? 'Connecting…'
                                : '🔌 Connect Serial Device'}
                        </button>
                    )}

                    {device.isConnected && (
                        <button className={clsx(styles.disconnectButton)} onClick={handleDisconnect}>
                            ⏏ {device.portName}
                        </button>
                    )}

                    <span className={clsx(styles.status, styles[device.connectionState])}>
                        {device.connectionState}
                    </span>
                </div>

                {device.error && <p className={clsx(styles.error)}>Error: {device.error}</p>}

                {device.isConnected && (
                    <Logs
                        messages={device.receivedData.map((d) => ({
                            type: 'log',
                            message: d.trim()
                        }))}
                        onClear={() => device.clearReceivedData()}
                        maxLines={25}
                    />
                )}
            </div>
        </FullscreenContext.Provider>
    );
});

export default Webserial;
