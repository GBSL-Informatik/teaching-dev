import React from 'react';
import type { RadarTarget } from '../models/protocol';
import styles from './styles.module.scss';

interface Props {
    targets: RadarTarget[];
    range: number;
}

export default function RadarChart({ targets, range }: Props) {
    const scale = 220 / range;
    return (
        <figure>
            <figcaption>Objektpositionen · Draufsicht</figcaption>
            <svg viewBox="0 0 520 300" role="img" aria-label="Objektpositionen nach Distanz und Winkel">
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
    );
}
