import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import { useStore } from '@tdev-hooks/useStore';
import Logs from '@tdev-components/documents/CodeEditor/Editor/Footer/Logs';
import { FullscreenContext } from '@tdev-hooks/useFullscreenTargetId';
import Alert from '@tdev-components/shared/Alert';
import Admonition from '@theme-original/Admonition';
import CodeBlock from '@theme-original/CodeBlock';
import { ConnectionState } from '../models/SerialDevice';
import Badge from '@tdev-components/shared/Badge';
import Card from '@tdev-components/shared/Card';
import Button from '@tdev-components/shared/Button';
import { mdiCloseNetwork, mdiConnection, mdiEjectCircle, mdiLoading } from '@mdi/js';
import Icon from '@mdi/react';

interface Props {
    /** Override default baud rate (default: 115200) */
    baudRate?: number;
    deviceId?: string;
}

const ConnectionStateMessage: Record<ConnectionState, string> = {
    disconnected: 'Getrennt',
    connecting: 'Verbinden…',
    connected: 'Verbunden',
    error: 'Fehler'
};

const ConnectionStateColor: Record<ConnectionState, string> = {
    disconnected: 'gray',
    connecting: 'orange',
    connected: 'green',
    error: 'red'
};

const ButtonIcon: Record<ConnectionState, string> = {
    disconnected: mdiConnection,
    connecting: mdiLoading,
    connected: mdiEjectCircle,
    error: mdiConnection
};
const ButtonColor: Record<ConnectionState, string> = {
    disconnected: 'blue',
    connecting: 'orange',
    connected: 'red',
    error: 'blue'
};
const ButtonText: Record<ConnectionState, string> = {
    disconnected: 'Serielles Gerät verbinden',
    connecting: 'Verbinden…',
    connected: 'Verbindung trennen',
    error: 'Erneut versuchen'
};

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
            <Card
                classNames={{ card: clsx(styles.webserial) }}
                header={
                    <div className={clsx(styles.toolbar)}>
                        {!webserialStore.isSupported && (
                            <Alert type="warning">
                                ⚠️ Die Web Serial API ist nicht unterstützt. Verwenden Sie Chrome oder Edge.
                            </Alert>
                        )}

                        {webserialStore.isSupported && (
                            <Button
                                onClick={device.isConnected ? handleDisconnect : handleConnect}
                                disabled={device.connectionState === 'connecting'}
                                spin={device.connectionState === 'connecting'}
                                icon={ButtonIcon[device.connectionState]}
                                color={ButtonColor[device.connectionState]}
                                text={ButtonText[device.connectionState]}
                            />
                        )}
                        <Badge color={ConnectionStateColor[device.connectionState]}>
                            {ConnectionStateMessage[device.connectionState]}
                        </Badge>
                    </div>
                }
            >
                {device.error && (
                    <>
                        <Admonition
                            type="danger"
                            title="Fehler"
                            icon={<Icon path={mdiCloseNetwork} size={1} />}
                            className={styles.error}
                        >
                            <CodeBlock language="text">{device.error}</CodeBlock>
                        </Admonition>
                        {/Failed to open serial port/.test(device.error) && (
                            <Admonition type="info" title="Troubleshooting" className={styles.error}>
                                Trennen Sie das Gerät vom Computer und verbinden Sie es erneut.
                            </Admonition>
                        )}
                    </>
                )}

                {(device.isConnected || device.receivedData.length > 0) && (
                    <Logs
                        messages={device.receivedData.map((d) => ({
                            type: 'log',
                            message: d
                        }))}
                        onClear={() => device.clearReceivedData()}
                        maxLines={25}
                    />
                )}
            </Card>
        </FullscreenContext.Provider>
    );
});

export default Webserial;
