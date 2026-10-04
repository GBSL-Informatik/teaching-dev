import React, { useEffect, useRef, useState } from 'react';
import { mdiConnection, mdiEject, mdiPlay, mdiStop } from '@mdi/js';
import Button from '@tdev-components/shared/Button';
import RadarDevice from '../models/RadarDevice';
import { getWebUsb } from '../models/FtdiTransport';
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
        setSupported(!!getWebUsb());
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
    const scale = 220 / range;
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
                        text={state === 'connected' ? 'Trennen' : 'USB verbinden'}
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
                    Live-Messungen benötigen WebUSB in Chrome oder Edge auf HTTPS oder localhost. Die Demo
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
                    <svg viewBox="0 0 520 300" role="img" aria-label="Zeitverlauf der nächsten Objektdistanz">
                        {[0, 0.25, 0.5, 0.75, 1].map((fraction) => (
                            <g key={fraction}>
                                <line
                                    className={styles.grid}
                                    x1="55"
                                    x2="495"
                                    y1={260 - fraction * 220}
                                    y2={260 - fraction * 220}
                                />
                                <text x="48" y={265 - fraction * 220} textAnchor="end">
                                    {range * fraction} m
                                </text>
                            </g>
                        ))}
                        {history.map((distance, index) =>
                            distance !== null && index > 0 && history[index - 1] !== null ? (
                                <line
                                    className={styles.trace}
                                    key={index}
                                    x1={55 + ((100 - history.length + index - 1) * 440) / 99}
                                    y1={260 - Math.min(history[index - 1]!, range) * scale}
                                    x2={55 + ((100 - history.length + index) * 440) / 99}
                                    y2={260 - Math.min(distance, range) * scale}
                                />
                            ) : null
                        )}
                        <text x="55" y="287">
                            älter
                        </text>
                        <text x="495" y="287" textAnchor="end">
                            neuer
                        </text>
                    </svg>
                </figure>
            </div>
            <div className={styles.table}>
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
                                    {busy ? 'Keine Objekte erkannt.' : 'USB verbinden oder Demo starten.'}
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
