import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import { useStore } from '@tdev-hooks/useStore';
import Logs from '@tdev-components/documents/CodeEditor/Editor/Footer/Logs';
import Alert from '@tdev-components/shared/Alert';
import Admonition from '@theme-original/Admonition';
import CodeBlock from '@theme-original/CodeBlock';
import { ConnectionState } from '../models/SerialDevice';
import Badge from '@tdev-components/shared/Badge';
import Card from '@tdev-components/shared/Card';
import Button from '@tdev-components/shared/Button';
import {
    mdiCardRemoveOutline,
    mdiCheckCircle,
    mdiCloseNetwork,
    mdiCloseOctagon,
    mdiConnection,
    mdiEjectCircle,
    mdiLoading,
    mdiSend,
    mdiSync
} from '@mdi/js';
import Icon from '@mdi/react';
import TextInput from '@tdev-components/shared/TextInput';
// @ts-ignore
import Details from '@theme/Details';
import { DeviceContext } from '../hooks/useDeviceId';
import ReplayControl from './ReplayControl';
import { FullscreenContext } from '@tdev-hooks/useFullscreenTargetId';
import RequestFullscreen from '@tdev-components/shared/RequestFullscreen';

interface Props {
    /** Override default baud rate (default: 115200) */
    baudRate?: number;
    deviceId?: string;
    hideLogs?: boolean;
    collapseLogs?: boolean;
    showInput?: boolean;
    inputPlaceholder?: string;
    inputLabel?: string;
    output?: React.ReactNode;
    /**
     * When this string is received from the serial device, the received data will be cleared.
     */
    resetTrigger?: string;
    /**
     * this data can be used to simulate a device by providing an array of strings that
     * will be emitted as if they were received from the serial device.
     * This is useful for testing and demo purposes without needing a real serial device.
     * Each string in the array represents a line of data that would be received, and
     * they will be emitted with a delay between them to simulate real-time data reception.
     */
    initialData?: string[];
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
const BadgeIcon: Record<ConnectionState, string> = {
    disconnected: mdiCloseNetwork,
    connecting: mdiLoading,
    connected: mdiCheckCircle,
    error: mdiCloseOctagon
};
const ButtonText: Record<ConnectionState, string> = {
    disconnected: 'Gerät verbinden',
    connecting: 'Verbinden…',
    connected: 'Verbindung trennen',
    error: 'Erneut versuchen'
};

const SwitchCollapsed = observer(
    ({ children, collapsed, title }: { children: React.ReactNode; collapsed?: boolean; title: string }) => {
        if (collapsed) {
            return <Details summary={title}>{children}</Details>;
        }
        return <>{children}</>;
    }
);

const Webserial = observer((props: Props) => {
    const id = React.useId();
    const defaultId = React.useId();
    const { baudRate, deviceId } = props;
    const viewStore = useStore('viewStore');
    const webserialStore = viewStore.useStore('webserialStore');
    const device = webserialStore.useDevice(deviceId ?? defaultId, baudRate ? { baudRate } : {}, {
        resetTrigger: props.resetTrigger
    });

    const handleConnect = async () => {
        await device.connect();
    };

    const handleDisconnect = async () => {
        await webserialStore.disconnectDevice(deviceId ?? defaultId);
    };

    React.useEffect(() => {
        if (props.initialData && props.initialData.length > 0) {
            device.setReplayData(props.initialData);
        }
    }, [device]);

    React.useEffect(() => {
        return () => {
            webserialStore.clearDevice(deviceId ?? defaultId);
        };
    }, [deviceId]);

    return (
        <FullscreenContext.Provider value={id}>
            <div id={id} className={clsx(viewStore.isFullscreenTarget(id) && styles.fullscreen)}>
                <DeviceContext.Provider value={deviceId ?? defaultId}>
                    <Card
                        classNames={{
                            card: clsx(styles.webserial),
                            body: clsx(
                                !device.error &&
                                    (props.hideLogs || !(device.isConnected || device.size > 0)) &&
                                    styles.noBody
                            )
                        }}
                        header={
                            <div className={clsx(styles.toolbar)}>
                                <div className={clsx(styles.actions)}>
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
                                    <ReplayControl device={device} />
                                </div>
                                <RequestFullscreen
                                    targetId={id}
                                    adminOnly
                                    className={clsx(styles.fullscreenButton)}
                                />
                                {device.size > 0 &&
                                    webserialStore.isSupported &&
                                    !(device.isReplaying || device.isReplayPaused) && (
                                        <Button
                                            onClick={() => device.clearReceivedData()}
                                            icon={mdiCardRemoveOutline}
                                            title="Empfangene Daten löschen"
                                        />
                                    )}
                                <Badge color={ConnectionStateColor[device.connectionState]}>
                                    <Icon
                                        path={
                                            device.isProcessing ? mdiSync : BadgeIcon[device.connectionState]
                                        }
                                        size={0.75}
                                        horizontal={device.isProcessing}
                                        spin={device.isProcessing}
                                    />
                                    {ConnectionStateMessage[device.connectionState]}
                                </Badge>
                            </div>
                        }
                        footer={props.output}
                    >
                        {!webserialStore.isSupported && (
                            <Alert type="warning">
                                ⚠️ Die Web Serial API ist nicht unterstützt. Verwenden Sie Chrome oder Edge.
                            </Alert>
                        )}
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
                        {!props.hideLogs && (device.isConnected || device.size > 0) && (
                            <SwitchCollapsed collapsed={props.collapseLogs} title="Logs">
                                <Logs
                                    messages={(device.receivedData[device.size - 1] === ''
                                        ? device.receivedData.slice(0, -1)
                                        : device.receivedData
                                    ).map((d) => ({
                                        type: 'log',
                                        message: d
                                    }))}
                                    maxLines={25}
                                />
                            </SwitchCollapsed>
                        )}
                        {props.showInput && device.isConnected && (
                            <div className={clsx(styles.input)}>
                                <TextInput
                                    onChange={(text) => {
                                        device.setInputValue(text);
                                    }}
                                    placeholder={props.inputPlaceholder}
                                    label={props.inputLabel}
                                    value={device.inputValue || ''}
                                    onEnter={() => {
                                        device.sendLine(device.inputValue);
                                        device.setInputValue('');
                                    }}
                                    className={clsx(styles.textInput)}
                                    labelClassName={clsx(styles.label)}
                                />
                                <Button
                                    onClick={() => {
                                        device.sendLine(device.inputValue);
                                        device.setInputValue('');
                                    }}
                                    icon={mdiSend}
                                />
                            </div>
                        )}
                    </Card>
                </DeviceContext.Provider>
            </div>
        </FullscreenContext.Provider>
    );
});

export default Webserial;
