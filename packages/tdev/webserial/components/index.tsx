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
}

const Webserial = observer((props: Props) => {
    const { baudRate } = props;
    const viewStore = useStore('viewStore');
    const webserialStore = viewStore.useStore('webserialStore');

    const handleConnect = async () => {
        await webserialStore.connect(baudRate ? { baudRate } : undefined);
    };

    const handleDisconnect = async () => {
        await webserialStore.disconnect();
    };

    return (
        <FullscreenContext.Provider value={'webserial'}>
            <div className={clsx(styles.Webserial)}>
                <div className={clsx(styles.toolbar)}>
                    {!webserialStore.isSupported && (
                        <p className={clsx(styles.warning)}>
                            ⚠️ Web Serial API is not supported in this browser. Use Chrome or Edge.
                        </p>
                    )}

                    {webserialStore.isSupported && !webserialStore.isConnected && (
                        <button
                            className={clsx(styles.connectButton)}
                            onClick={handleConnect}
                            disabled={webserialStore.connectionState === 'connecting'}
                        >
                            {webserialStore.connectionState === 'connecting'
                                ? 'Connecting…'
                                : '🔌 Connect Serial Device'}
                        </button>
                    )}

                    {webserialStore.isConnected && (
                        <button className={clsx(styles.disconnectButton)} onClick={handleDisconnect}>
                            ⏏ Disconnect
                        </button>
                    )}

                    <span className={clsx(styles.status, styles[webserialStore.connectionState])}>
                        {webserialStore.connectionState}
                    </span>
                </div>

                {webserialStore.error && <p className={clsx(styles.error)}>Error: {webserialStore.error}</p>}

                {webserialStore.isConnected && (
                    <Logs
                        messages={webserialStore.receivedData.map((d) => ({
                            type: 'log',
                            message: d.trim()
                        }))}
                        onClear={() => webserialStore.clearReceivedData()}
                        maxLines={25}
                    />
                )}
            </div>
        </FullscreenContext.Provider>
    );
});

export default Webserial;
