import { mdiConnection, mdiEject, mdiPlay, mdiStop } from '@mdi/js';
import DefinitionList from '@tdev-components/DefinitionList';
import Loader from '@tdev-components/Loader';
import Alert from '@tdev-components/shared/Alert';
import Badge from '@tdev-components/shared/Badge';
import Button from '@tdev-components/shared/Button';
import Card from '@tdev-components/shared/Card';
import SelectInput from '@tdev-components/shared/SelectInput';
import ReplayControl from '@tdev/webserial/component/ReplayControl';
import type { BinarySample } from '@tdev/webserial/models/SerialBinaryDevice';
import { observer } from 'mobx-react-lite';
import { useEffect, useId, useRef, useState } from 'react';
import useRadarDevice from '../hooks/useRadarDevice';
import RadarDevice from '../models/RadarDevice';
import { DEFAULT_SETTINGS, DISTANCE_RANGES, SPEED_RANGES, type RadarSettings } from '../models/protocol';
import DistanceChart from './DistanceChart';
import RadarChart from './RadarChart';
import styles from './styles.module.scss';

export interface Props {
    initialSettings?: Partial<RadarSettings>;
    demo?: boolean;
    deviceId?: string;
    initialData?: BinarySample[];
}

const Radar = observer(({ initialSettings, demo = false, deviceId: providedId, initialData }: Props) => {
    const generatedId = useId();
    const deviceId = providedId ?? `radar-${generatedId}`;
    const device = useRadarDevice(deviceId);
    const [settings, setSettings] = useState<RadarSettings>({ ...DEFAULT_SETTINGS, ...initialSettings });
    const targets = device.targets;
    const [state, setState] = useState<'disconnected' | 'connecting' | 'connected' | 'demo'>('disconnected');
    const [error, setError] = useState('');
    const [supported, setSupported] = useState(false);
    const history = device.history;
    const mounted = useRef(false);
    const range = DISTANCE_RANGES[settings.range] || 10;
    const replaying = device.device.isReplaying || device.device.isReplayPaused;
    const busy = state !== 'disconnected' || replaying;

    const startDemo = () => {
        setError('');
        device.device.setReplayData(initialData ?? RadarDevice.createDemoData(range));
        device.device.setReplaySpeed(100);
        device.device.replay();
        setState('demo');
    };

    useEffect(() => {
        mounted.current = true;
        setSupported(device.device.webserialStore.isSupported);
        if (initialData?.length) {
            device.device.setReplayData(initialData);
        } else if (demo) {
            device.device.setReplayData(RadarDevice.createDemoData(range));
        }
        return () => {
            mounted.current = false;
        };
    }, [device, initialData]);

    useEffect(() => {
        if (state === 'demo' && !replaying) {
            setState('disconnected');
        }
    }, [state, replaying]);

    const stop = async () => {
        setState('connecting');
        device.device.stopReplay();
        await device.disconnect();
        if (mounted.current) {
            setState('disconnected');
        }
    };

    const connect = async () => {
        setError('');
        setState('connecting');
        try {
            await device.connect(settings);
            if (!mounted.current) {
                await device.disconnect();
                return;
            }
            setState('connected');
            device.start(
                () => {},
                (failure) => {
                    if (mounted.current) {
                        setError(failure.message);
                        void stop();
                    }
                }
            );
        } catch (failure) {
            await device.disconnect();
            if (mounted.current) {
                setState('disconnected');
                if (!(failure instanceof DOMException && failure.name === 'NotFoundError')) {
                    setError(failure instanceof Error ? failure.message : String(failure));
                }
            }
        }
    };

    const select = (key: keyof RadarSettings, label: string, values: (string | number)[]) => (
        <label>
            {label}
            <SelectInput
                value={String(settings[key])}
                disabled={device.device.isConnected || busy}
                options={values.map((value, index) => ({ value: String(index), label: String(value) }))}
                onChange={(value) => setSettings((previous) => ({ ...previous, [key]: Number(value) }))}
            />
        </label>
    );
    const nearest = device.getMinimumDistance();

    return (
        <section aria-label="K-LD7 Radar">
            <Card
                classNames={{ card: styles.radar }}
                header={
                    <div className={styles.toolbar}>
                        <div>
                            <strong>K-LD7 Radar</strong>
                            <span className={styles.status} role="status">
                                <Badge
                                    type={
                                        state === 'connected' ? 'success' : replaying ? 'info' : 'secondary'
                                    }
                                >
                                    {state === 'demo'
                                        ? 'Demo · simulierte Messwerte'
                                        : replaying
                                          ? 'Replay · aufgezeichnete Messwerte'
                                          : state === 'connected'
                                            ? 'Verbunden · Live-Messung'
                                            : state === 'connecting'
                                              ? 'Verbindung wird bearbeitet…'
                                              : 'Getrennt'}
                                </Badge>
                            </span>
                        </div>
                        <div className={styles.actions}>
                            <Button
                                icon={state === 'connected' ? mdiEject : mdiConnection}
                                text={state === 'connected' ? 'Trennen' : 'Seriell verbinden'}
                                disabled={
                                    state === 'connecting' ||
                                    state === 'demo' ||
                                    replaying ||
                                    (!supported && state !== 'connected')
                                }
                                onClick={() => void (state === 'connected' ? stop() : connect())}
                            />
                            <Button
                                icon={state === 'demo' ? mdiStop : mdiPlay}
                                text={state === 'demo' ? 'Demo stoppen' : 'Demo starten'}
                                disabled={
                                    state === 'connecting' ||
                                    state === 'connected' ||
                                    (replaying && state !== 'demo')
                                }
                                onClick={() => (state === 'demo' ? void stop() : startDemo())}
                            />
                        </div>
                    </div>
                }
            >
                {state === 'connecting' && <Loader label="Verbindung wird bearbeitet…" size={0.75} />}
                {error && (
                    <div role="alert">
                        <Alert type="danger">{error}</Alert>
                    </div>
                )}
                {!supported && (
                    <Alert type="info">
                        Live-Messungen benötigen WebSerial in Chrome oder Edge auf HTTPS oder localhost. Die
                        Demo funktioniert ohne USB.
                    </Alert>
                )}
                {(state === 'disconnected' || state === 'demo') && <ReplayControl device={device.device} />}
                <div className={styles.settings}>
                    {select(
                        'range',
                        'Messbereich',
                        DISTANCE_RANGES.map((value) => `${value} m`)
                    )}
                    {select(
                        'speed',
                        'Max. Geschwindigkeit',
                        SPEED_RANGES.map((value) => `${value} km/h`)
                    )}
                    {select('frequency', 'Frequenzkanal', ['Tief', 'Mittel', 'Hoch'])}
                    {select('tracking', 'Tracking-Filter', [
                        'Standard',
                        'Schnelle Erkennung',
                        'Lange Sichtbarkeit'
                    ])}
                    {select(
                        'sensitivity',
                        'Mikro-Empfindlichkeit',
                        Array.from({ length: 10 }, (_, index) => index)
                    )}
                </div>
                <p className={styles.hint}>
                    Einstellungen werden beim Verbinden gesetzt. Der Messbereich muss alle erwarteten Ziele
                    einschliessen.
                </p>
                <DefinitionList small compact>
                    <dt>Erkannte Objekte</dt>
                    <dd>{targets.length}</dd>
                    <dt>Nächste Distanz</dt>
                    <dd>{nearest === null ? '—' : `${nearest.toFixed(2)} m`}</dd>
                    <dt>Messbereich</dt>
                    <dd>{range} m</dd>
                </DefinitionList>
                <div className={styles.plots}>
                    <RadarChart targets={targets} range={range} />
                    <DistanceChart history={history} />
                </div>
                <div className={styles.table} role="region" aria-label="Messwerte" tabIndex={0}>
                    <table>
                        <thead>
                            <tr>
                                <th>Objekt</th>
                                <th>Distanz</th>
                                <th>Geschwindigkeit</th>
                                <th>Winkel</th>
                                <th>Signal</th>
                            </tr>
                        </thead>
                        <tbody>
                            {targets.map((target, index) => (
                                <tr key={index}>
                                    <td>{index + 1}</td>
                                    <td>{target.distance.toFixed(2)} m</td>
                                    <td>{target.speed.toFixed(2)} km/h</td>
                                    <td>{target.angle.toFixed(1)}°</td>
                                    <td>{target.magnitude.toFixed(1)} dB</td>
                                </tr>
                            ))}
                            {!targets.length && (
                                <tr>
                                    <td colSpan={5}>
                                        {busy
                                            ? 'Keine Objekte erkannt.'
                                            : 'Seriell verbinden oder Demo starten.'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <p className={styles.hint}>
                    Die Objektnummer gilt pro Messung. PDAT liefert bewegte Ziele ohne dauerhafte Objekt-ID.
                </p>
            </Card>
        </section>
    );
});

export default Radar;
