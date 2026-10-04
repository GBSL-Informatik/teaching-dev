import React from 'react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import styles from './styles.module.scss';

interface Props {
    history: (number | null)[];
    range: number;
}

export default function DistanceChart({ history, range }: Props) {
    const distanceData = history.map((distance, index) => ({ sample: index - history.length + 1, distance }));
    return (
        <figure>
            <figcaption>Nächste Distanz · gefiltert · letzte 100 Messungen</figcaption>
            <div className={styles.chart} role="img" aria-label="Zeitverlauf der nächsten Objektdistanz">
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <LineChart data={distanceData} margin={{ top: 20, right: 25, bottom: 25, left: 5 }}>
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
                        <YAxis type="number" domain={[0, range]} allowDataOverflow unit=" m" width={65} />
                        <Tooltip
                            labelFormatter={(value) =>
                                Number(value) === 0
                                    ? 'Aktuelle Messung'
                                    : `Vor ${Math.abs(Number(value))} Messungen`
                            }
                            formatter={(value) => [`${Number(value).toFixed(2)} m`, 'Nächste Distanz']}
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
    );
}
