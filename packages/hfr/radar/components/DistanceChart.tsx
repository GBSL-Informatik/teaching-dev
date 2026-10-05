import { IfmColors } from '@tdev-components/shared/Colors';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import styles from './styles.module.scss';

interface Props {
    history: (number | null)[];
}

export default function DistanceChart({ history }: Props) {
    const distanceData = history.map((distance, index) => ({ distance, sample: index - history.length + 1 }));
    const maxDistance = Math.ceil(
        history.reduce<number>((maximum, distance) => Math.max(maximum, distance ?? 0), 1)
    );
    return (
        <figure>
            <figcaption>Nächste Distanz · One Euro · letzte 100 Messungen</figcaption>
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
                        <YAxis
                            type="number"
                            domain={[0, maxDistance]}
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
                            formatter={(value, name) => [`${Number(value).toFixed(2)} m`, name]}
                            contentStyle={{
                                background: 'var(--ifm-background-surface-color)',
                                borderColor: 'var(--ifm-color-emphasis-300)'
                            }}
                        />
                        <Line
                            type="linear"
                            dataKey="distance"
                            name="One Euro"
                            stroke={IfmColors.orange}
                            strokeWidth={2}
                            dot={true}
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
