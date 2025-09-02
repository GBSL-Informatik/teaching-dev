import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import Loader from '@tdev-components/Loader';
import Button from '@tdev-components/shared/Button';
import { useClientLib } from '@tdev-hooks/useClientLib';
import type { default as QrScannerLib } from '@yudiel/react-qr-scanner';
import Storage from '@tdev-stores/utils/Storage';
import { mdiCameraFlipOutline } from '@mdi/js';
import CodeBlockWrapper from '@tdev/theme/CodeBlock';

interface Props {
    redirect?: boolean;
    inNewTab?: boolean;
    hideOpenLinkButton?: boolean;
    onScan?: (qr: string) => void;
}
const Scanner = (props: Props) => {
    const [reloadKey, setReloadKey] = React.useState(1);
    const deviceId = React.useRef<string | undefined>(Storage.get('QrScannerDeviceId'));
    const Lib = useClientLib<typeof QrScannerLib>(
        () => import('@yudiel/react-qr-scanner'),
        '@yudiel/react-qr-scanner'
    );
    if (!Lib) {
        return <Loader />;
    }
    return (
        <ScannerComponent
            key={reloadKey}
            Lib={Lib}
            onChangeSrc={(id) => {
                if (deviceId.current === id && reloadKey > 5) {
                    setReloadKey(1);
                    Storage.remove('QrScannerDeviceId');
                } else {
                    setReloadKey((prev) => prev + 1);
                }
                deviceId.current = id;
            }}
            {...props}
        />
    );
};

const ScannerComponent = (
    props: { Lib: typeof QrScannerLib; onChangeSrc: (id?: string) => void } & Props
) => {
    const { Lib } = props;
    const [error, setError] = React.useState<string | undefined>();
    const [qr, setQr] = React.useState('');
    const [deviceId, setDeviceId] = React.useState<string | undefined>(
        Storage.get('QrScannerDeviceId', undefined)
    );
    const devices = Lib.useDevices();
    React.useEffect(() => {
        if (devices.length > 0 && deviceId) {
            if (!devices.find((d) => d.deviceId === deviceId)) {
                Storage.remove('QrScannerDeviceId');
                setDeviceId(undefined);
            }
        }
    }, [devices]);
    const clearErrorMessage = React.useCallback(() => {
        setError(undefined);
    }, []);
    const deviceIdx = devices.findIndex((d) => d.deviceId === deviceId);
    const showFooter = qr || devices.length > 1 || error;
    return (
        <div className={clsx('card', styles.qr)}>
            <div className={clsx(styles.scanner, 'card__body')}>
                {devices.length > 0 ? (
                    <Lib.Scanner
                        paused={!!qr}
                        onScan={(result) => {
                            clearErrorMessage();
                            setQr(result[0].rawValue);
                            if (props.onScan) {
                                props.onScan(result[0].rawValue);
                            }
                            if (props.redirect) {
                                try {
                                    const url = new URL(result[0].rawValue);
                                    if (props.inNewTab) {
                                        window.open(url.href, '_blank');
                                    } else {
                                        window.location.href = url.href;
                                    }
                                } catch (e) {
                                    setError(`Invalide URL: "${result[0].rawValue}"`);
                                }
                            }
                        }}
                        onError={(err) => {
                            setTimeout(() => {
                                props.onChangeSrc(deviceId);
                            }, 30);
                            setError('Die Kamera konnte nicht gestartet werden.');
                        }}
                        constraints={{
                            deviceId: deviceId
                        }}
                        allowMultiple={false}
                        components={{
                            torch: true,
                            finder: true,
                            zoom: true,
                            onOff: true
                        }}
                        sound={false}
                    />
                ) : (
                    <Loader />
                )}
            </div>
            {showFooter && (
                <div className="card__footer">
                    {devices.length > 1 && (
                        <Button
                            icon={mdiCameraFlipOutline}
                            text={
                                devices.length > 2
                                    ? `${(deviceIdx >= 0 ? deviceIdx : 0) + 1}/${devices.length}`
                                    : ''
                            }
                            onClick={() => {
                                const nextDeviceIdx = ((deviceIdx >= 0 ? deviceIdx : 0) + 1) % devices.length;
                                const deviceId = devices[nextDeviceIdx].deviceId;
                                Storage.set('QrScannerDeviceId', deviceId);
                                props.onChangeSrc(deviceId);
                            }}
                            iconSide="left"
                        />
                    )}
                    {qr && (
                        <>
                            <small>{qr}</small>
                            <div className="button-group button-group--block">
                                <Button
                                    className={clsx('button--block')}
                                    text="Neu scannen"
                                    color="secondary"
                                    onClick={() => setQr('')}
                                />
                                {!props.hideOpenLinkButton && (
                                    <Button
                                        className={clsx('button--block')}
                                        color="primary"
                                        text="Besuchen"
                                        href={qr}
                                    />
                                )}
                            </div>
                        </>
                    )}
                    {error && (
                        <CodeBlockWrapper
                            title="Fehlermeldung"
                            metastring="{1-99}"
                            className={clsx(styles.error)}
                        >
                            {error}
                        </CodeBlockWrapper>
                    )}
                </div>
            )}
        </div>
    );
};

export default Scanner;
