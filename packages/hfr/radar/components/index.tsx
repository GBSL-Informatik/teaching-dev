import React, { useEffect, useId, useRef, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { useStore } from '@tdev-hooks/useStore';
import ReplayControl from '@tdev/webserial/component/ReplayControl';
import '@tdev/webserial';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { mdiConnection, mdiEject, mdiPlay, mdiStop } from '@mdi/js';
import Button from '@tdev-components/shared/Button';
import RadarDevice from '../models/RadarDevice';
import {
    DEFAULT_SETTINGS,
    DISTANCE_RANGES,
    SPEED_RANGES,
    type RadarSettings,
    type RadarTarget
} from '../models/protocol';
import styles from './styles.module.scss';

export interface Props {
    initialSettings?: Partial<RadarSettings>;
    demo?: boolean;
}

const Radar = observer(({ initialSettings, demo = false }: Props) => {
    const viewStore = useStore('viewStore');
    const webserialStore = viewStore.useStore('webserialStore');
    const deviceId = `radar-${useId()}`;
    const [settings, setSettings] = useState<RadarSettings>({ ...DEFAULT_SETTINGS, ...initialSettings });
    const [targets, setTargets] = useState<RadarTarget[]>([]);
    const [state, setState] = useState<'disconnected' | 'connecting' | 'connected' | 'demo'>('disconnected');
    const [error, setError] = useState('');
    const [supported, setSupported] = useState(false);
    const [history, setHistory] = useState<(number | null)[]>([]);
    const device = useRef<RadarDevice | undefined>(undefined);
    const mounted = useRef(false);
    const range = DISTANCE_RANGES[settings.range] || 10;
    const replaying =
        !!device.current && (device.current.device.isReplaying || device.current.device.isReplayPaused);
    const busy = state !== 'disconnected' || replaying;

    const update = (values: RadarTarget[]) => {
        if (!mounted.current) {
            return;
        }
        setTargets(values);
        setHistory((previous) => [
            ...previous.slice(-99),
            values.length ? Math.min(...values.map((target) => target.distance)) : null
        ]);
    };

    const startDemo = () => {
        setError('');
        setHistory([]);
        setState('demo');
        const current = device.current ?? RadarDevice.request(webserialStore, deviceId);
        device.current = current;
        current.startDemo(range, update);
    };

    useEffect(() => {
        mounted.current = true;
        setSupported(webserialStore.isSupported);
        if (demo) {
            startDemo();
        }
        return () => {
            mounted.current = false;
            const current = device.current;
            if (current) {
                void current.close().then(() => webserialStore.clearDevice(deviceId));
            }
        };
    }, []);

    const stop = async () => {
        const current = device.current;
        setState('connecting');
        await current?.disconnect();
        if (mounted.current) {
            setTargets([]);
            setState('disconnected');
        }
    };

    const connect = async () => {
        setError('');
        setHistory([]);
        setState('connecting');
        let current: RadarDevice | undefined;
        try {
            await device.current?.close();
            current = RadarDevice.request(webserialStore, deviceId);
            if (!mounted.current) {
                await current.close();
                return;
            }
            device.current = current;
            await current.connect(settings);
            if (!mounted.current) {
                await current.close();
                return;
            }
            setState('connected');
            current.start(
                update,
                (failure) => {
                    if (mounted.current) {
                        setError(failure.message);
                        void stop();
                    }
                },
                () => {
                    if (mounted.current) {
                        setTargets([]);
                        setHistory([]);
                    }
                }
            );
        } catch (failure) {
            await current?.close();
            device.current = undefined;
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
            <select
                value={settings[key]}
                disabled={busy}
                onChange={(event) => setSettings({ ...settings, [key]: Number(event.target.value) })}
            >
                {values.map((value, index) => (
                    <option key={index} value={index}>
                        {value}
                    </option>
                ))}
            </select>
        </label>
    );
    const scale = 220 / range;
    const distanceData = history.map((distance, index) => ({ sample: index - history.length + 1, distance }));
    const nearest = targets.length ? Math.min(...targets.map((target) => target.distance)) : undefined;

    return (
        <section className={styles.radar} aria-label="K-LD7 Radar">
            <div className={styles.toolbar}>
                <div>
                    <strong>K-LD7 Radar</strong>
                    <span className={styles.status} role="status">
                        {replaying
                            ? 'Replay · aufgezeichnete Messwerte'
                            : state === 'demo'
                              ? 'Demo · simulierte Messwerte'
                              : state === 'connected'
                                ? 'Verbunden · Live-Messung'
                                : state === 'connecting'
                                  ? 'Verbindung wird bearbeitet…'
                                  : 'Getrennt'}
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
                        disabled={state === 'connecting' || state === 'connected' || replaying}
                        onClick={() => (state === 'demo' ? void stop() : startDemo())}
                    />
                </div>
            </div>
            {error && (
                <p className={styles.error} role="alert">
                    {error}
                </p>
            )}
            {!supported && (
                <p>
                    Live-Messungen benötigen WebSerial in Chrome oder Edge auf HTTPS oder localhost. Die Demo
                    funktioniert ohne USB.
                </p>
            )}
            {device.current && state === 'disconnected' && <ReplayControl device={device.current.device} />}
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
            <div className={styles.summary}>
                <span>
                    <strong>{targets.length}</strong> erkannte Objekte
                </span>
                <span>
                    <strong>{nearest === undefined ? '—' : `${nearest.toFixed(2)} m`}</strong> nächste Distanz
                </span>
                <span>
                    <strong>{range} m</strong> Messbereich
                </span>
            </div>
            <div className={styles.plots}>
                <figure>
                    <figcaption>Objektpositionen · Draufsicht</figcaption>
                    <svg
                        viewBox="0 0 520 300"
                        role="img"
                        aria-label="Objektpositionen nach Distanz und Winkel"
                    >
                        {[0.25, 0.5, 0.75, 1].map((fraction) => (
                            <g key={fraction}>
                                <path
                                    className={styles.grid}
                                    d={`M ${260 - 220 * fraction} 260 A ${220 * fraction} ${220 * fraction} 0 0 1 ${260 + 220 * fraction} 260`}
                                />
                                <text x="267" y={260 - 220 * fraction + 14}>
                                    {range * fraction} m
                                </text>
                            </g>
                        ))}
                        {[-60, -40, 0, 40, 60].map((angle) => (
                            <line
                                className={styles.grid}
                                key={angle}
                                x1="260"
                                y1="260"
                                x2={260 + 220 * Math.sin((angle * Math.PI) / 180)}
                                y2={260 - 220 * Math.cos((angle * Math.PI) / 180)}
                            />
                        ))}
                        {targets
                            .filter((target) => target.distance <= range)
                            .map((target, index) => (
                                <g key={index}>
                                    <circle
                                        className={styles.target}
                                        cx={260 + target.x * scale}
                                        cy={260 - target.y * scale}
                                        r="6"
                                    >
                                        <title>
                                            {target.distance.toFixed(2)} m · {target.angle.toFixed(1)}° ·{' '}
                                            {target.speed.toFixed(2)} km/h
                                        </title>
                                    </circle>
                                    <text x={270 + target.x * scale} y={255 - target.y * scale}>
                                        {index + 1}
                                    </text>
                                </g>
                            ))}
                        <circle cx="260" cy="260" r="7" className={styles.sensor} />
                        <text x="260" y="287" textAnchor="middle">
                            Sensor · 0 m
                        </text>
                    </svg>
                </figure>
                <figure>
                    <figcaption>Nächste Distanz · letzte 100 Messungen</figcaption>
                    <div
                        className={styles.chart}
                        role="img"
                        aria-label="Zeitverlauf der nächsten Objektdistanz"
                    >
                        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                            <LineChart
                                data={distanceData}
                                margin={{ top: 20, right: 25, bottom: 25, left: 5 }}
                            >
                                <CartesianGrid stroke="var(--ifm-color-emphasis-300)" />
                                <XAxis
                                    type="number"
                                    dataKey="sample"
                                    domain={[-99, 0]}
                                    ticks={[-99, -75, -50, -25, 0]}
                                    label={{
                                        value: 'Messungen vor jetzt',
                                        position: 'insideBottom',
                                        offset: -15
                                    }}
                                    tickFormatter={(value) => String(Math.abs(value))}
                                />
                                <YAxis
                                    type="number"
                                    domain={[0, range]}
                                    allowDataOverflow
                                    unit=" m"
                                    width={65}
                                />
                                <Tooltip
                                    labelFormatter={(value) =>
                                        Number(value) === 0
                                            ? 'Aktuelle Messung'
                                            : `Vor ${Math.abs(Number(value))} Messungen`
                                    }
                                    formatter={(value) => [
                                        `${Number(value).toFixed(2)} m`,
                                        'Nächste Distanz'
                                    ]}
                                    contentStyle={{
                                        background: 'var(--ifm-background-surface-color)',
                                        borderColor: 'var(--ifm-color-emphasis-300)'
                                    }}
                                />
                                <Line
                                    type="linear"
                                    dataKey="distance"
                                    name="Nächste Distanz"
                                    stroke="var(--ifm-color-primary)"
                                    strokeWidth={2}
                                    dot={false}
                                    activeDot={{ r: 4 }}
                                    connectNulls={false}
                                    isAnimationActive={false}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </figure>
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
                                    {busy ? 'Keine Objekte erkannt.' : 'Seriell verbinden oder Demo starten.'}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            <p className={styles.hint}>
                Die Objektnummer gilt pro Messung. PDAT liefert bewegte Ziele ohne dauerhafte Objekt-ID.
            </p>
        </section>
    );
});

export default Radar;
