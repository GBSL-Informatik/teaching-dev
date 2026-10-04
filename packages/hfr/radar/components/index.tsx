import React, { useEffect, useRef, useState } from 'react';
import {
    CartesianGrid,
    LabelList,
    Line,
    LineChart,
    ReferenceDot,
    ResponsiveContainer,
    Scatter,
    ScatterChart,
    Tooltip,
    XAxis,
    YAxis
} from 'recharts';
import { mdiConnection, mdiEject, mdiPlay, mdiStop } from '@mdi/js';
import Button from '@tdev-components/shared/Button';
import RadarDevice from '../models/RadarDevice';
import { getWebSerial } from '../models/WebSerialTransport';
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

const Radar = ({ initialSettings, demo = false }: Props) => {
    const [settings, setSettings] = useState<RadarSettings>({ ...DEFAULT_SETTINGS, ...initialSettings });
    const [targets, setTargets] = useState<RadarTarget[]>([]);
    const [state, setState] = useState<'disconnected' | 'connecting' | 'connected' | 'demo'>('disconnected');
    const [error, setError] = useState('');
    const [supported, setSupported] = useState(false);
    const [history, setHistory] = useState<(number | null)[]>([]);
    const device = useRef<RadarDevice | undefined>(undefined);
    const mounted = useRef(false);
    const demoTimer = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
    const range = DISTANCE_RANGES[settings.range] || 10;
    const busy = state !== 'disconnected';

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
        let tick = 0;
        const sample = () => {
            tick += 0.12;
            update(
                [0, 1, 2].map((index) => {
                    const distance = range * (0.24 + index * 0.2 + Math.sin(tick + index) * 0.08);
                    const angle = Math.sin(tick / 3 + index * 2) * 35;
                    const radians = (angle * Math.PI) / 180;
                    return {
                        distance,
                        angle,
                        speed: Math.cos(tick + index) * 2,
                        magnitude: 30 + index * 5,
                        x: -distance * Math.sin(radians),
                        y: distance * Math.cos(radians)
                    };
                })
            );
        };
        sample();
        demoTimer.current = setInterval(sample, 100);
    };

    useEffect(() => {
        mounted.current = true;
        setSupported(!!getWebSerial());
        if (demo) {
            startDemo();
        }
        return () => {
            mounted.current = false;
            clearInterval(demoTimer.current);
            void device.current?.close();
        };
    }, []);

    const stop = async () => {
        clearInterval(demoTimer.current);
        const current = device.current;
        device.current = undefined;
        setState('connecting');
        await current?.close();
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
            current = await RadarDevice.request();
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
            current.start(update, (failure) => {
                if (mounted.current) {
                    setError(failure.message);
                    void stop();
                }
            });
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
    const positionData = targets
        .map((target, index) => ({ ...target, id: index + 1 }))
        .filter((target) => target.distance <= range);
    const distanceData = history.map((distance, index) => ({ sample: index - history.length + 1, distance }));
    const nearest = targets.length ? Math.min(...targets.map((target) => target.distance)) : undefined;

    return (
        <section className={styles.radar} aria-label="K-LD7 Radar">
            <div className={styles.toolbar}>
                <div>
                    <strong>K-LD7 Radar</strong>
                    <span className={styles.status} role="status">
                        {state === 'demo'
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
                            (!supported && state !== 'connected')
                        }
                        onClick={() => void (state === 'connected' ? stop() : connect())}
                    />
                    <Button
                        icon={state === 'demo' ? mdiStop : mdiPlay}
                        text={state === 'demo' ? 'Demo stoppen' : 'Demo starten'}
                        disabled={state === 'connecting' || state === 'connected'}
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
                    <div
                        className={styles.chart}
                        role="img"
                        aria-label="Objektpositionen nach Distanz und Winkel"
                    >
                        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                            <ScatterChart margin={{ top: 20, right: 25, bottom: 25, left: 5 }}>
                                <CartesianGrid stroke="var(--ifm-color-emphasis-300)" />
                                <XAxis
                                    type="number"
                                    dataKey="x"
                                    domain={[-range, range]}
                                    allowDataOverflow
                                    name="Seitliche Position"
                                    unit=" m"
                                    tickCount={5}
                                    label={{
                                        value: 'Seitliche Position (m)',
                                        position: 'insideBottom',
                                        offset: -15
                                    }}
                                />
                                <YAxis
                                    type="number"
                                    dataKey="y"
                                    domain={[0, range]}
                                    allowDataOverflow
                                    name="Entfernung nach vorne"
                                    unit=" m"
                                    width={65}
                                />
                                <Tooltip
                                    content={({ active, payload }) => {
                                        const target = payload?.[0]?.payload as
                                            (RadarTarget & { id: number }) | undefined;
                                        return active && target ? (
                                            <div className={styles.tooltip}>
                                                <strong>Objekt {target.id}</strong>
                                                <div>Distanz: {target.distance.toFixed(2)} m</div>
                                                <div>Geschwindigkeit: {target.speed.toFixed(2)} km/h</div>
                                                <div>Winkel: {target.angle.toFixed(1)}°</div>
                                                <div>Signal: {target.magnitude.toFixed(1)} dB</div>
                                            </div>
                                        ) : null;
                                    }}
                                />
                                <ReferenceDot
                                    x={0}
                                    y={0}
                                    r={5}
                                    fill="var(--ifm-color-emphasis-700)"
                                    stroke="none"
                                    pointerEvents="none"
                                    label={{ value: 'Sensor', position: 'top', pointerEvents: 'none' }}
                                />
                                <Scatter
                                    name="Objekte"
                                    data={positionData}
                                    fill="var(--ifm-color-primary)"
                                    isAnimationActive={false}
                                >
                                    <LabelList dataKey="id" position="right" />
                                </Scatter>
                            </ScatterChart>
                        </ResponsiveContainer>
                    </div>
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
};

export default Radar;
