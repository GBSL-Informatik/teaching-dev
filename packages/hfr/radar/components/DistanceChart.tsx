import { IfmColors } from '@tdev-components/shared/Colors';
import type { DistanceRecord } from '../models/DistanceFilters';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import styles from './styles.module.scss';

const SERIES = [
    {
        key: 'selected',
        name: 'Ausgewählt (roh)',
        color: IfmColors.gray,
        dash: '4 4'
    },
    {
        key: 'legacy',
        name: 'Bisheriger Filter',
        color: IfmColors.primary,
        dash: undefined
    },
    { key: 'oneEuro', name: 'One Euro', color: IfmColors.orange, dash: undefined },
    { key: 'kalman', name: 'Kalman', color: IfmColors.red, dash: undefined }
];

interface Props {
    history: DistanceRecord[];
}

export default function DistanceChart({ history }: Props) {
    const distanceData = history.map((record, index) => ({ ...record, sample: index - history.length + 1 }));
    const maxDistance = Math.ceil(
        history.reduce(
            (maximum, record) =>
                Math.max(
                    maximum,
                    record.selected ?? 0,
                    record.legacy ?? 0,
                    record.oneEuro ?? 0,
                    record.kalman ?? 0
                ),
            1
        )
    );
    return (
        <figure>
            <figcaption>Distanzfilter im Vergleich · letzte 100 Messungen</figcaption>
            <div className={styles.legend} aria-label="Filterlegende">
                {SERIES.map(({ key, name, color, dash }) => (
                    <span key={key} style={{ color }}>
                        <span
                            aria-hidden="true"
                            style={{ borderTop: `2px ${dash ? 'dashed' : 'solid'} ${color}` }}
                        />
                        {name}
                    </span>
                ))}
            </div>
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
                        {SERIES.map(({ key, name, color, dash }) => (
                            <Line
                                key={key}
                                type="linear"
                                dataKey={key}
                                name={name}
                                stroke={color}
                                strokeDasharray={dash}
                                strokeWidth={2}
                                dot={true}
                                activeDot={{ r: 4 }}
                                connectNulls={false}
                                isAnimationActive={false}
                            />
                        ))}
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </figure>
    );
}
