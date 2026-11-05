import type { CommitGraphNode } from '@tdev-models/documents/iCode';
import type { GraphRow } from '@tdev-models/helpers/commitGraph';
import clsx from 'clsx';
import styles from './styles.module.scss';

const LANE_WIDTH = 16;
const ROW_HEIGHT = 32;
const DOT_Y = ROW_HEIGHT / 2;
const LANE_COLOR_COUNT = 5;

const laneX = (lane: number) => lane * LANE_WIDTH + LANE_WIDTH / 2;
const laneClass = (lane: number) => styles[`lane${lane % LANE_COLOR_COUNT}`];

/**
 * S-curve from the top of `fromLane` into the dot on `toLane`.
 */
const mergePath = (fromLane: number, toLane: number) => {
    const fromX = laneX(fromLane);
    const toX = laneX(toLane);
    return `M ${fromX} 0 C ${fromX} ${DOT_Y}, ${toX} 0, ${toX} ${DOT_Y}`;
};

interface Props {
    row: GraphRow<CommitGraphNode>;
    laneCount: number;
    isHead: boolean;
}

/**
 * The graph part of a commit row: the dot of the commit and the lanes around it.
 * The lanes continuing below the dot are stretched to the row's height (e.g. when details are shown).
 */
const GraphCell = (props: Props) => {
    const { row, laneCount, isHead } = props;
    const width = laneCount * LANE_WIDTH;
    const continuingLanes = row.hasParent ? [...row.passingLanes, row.lane] : row.passingLanes;
    return (
        <div className={styles.graph}>
            <svg width={width} height={ROW_HEIGHT} className={styles.graphHead}>
                {row.passingLanes.map((lane) => (
                    <line
                        key={lane}
                        x1={laneX(lane)}
                        y1={0}
                        x2={laneX(lane)}
                        y2={ROW_HEIGHT}
                        className={laneClass(lane)}
                    />
                ))}
                {row.incomingLanes.map((lane) => (
                    <path key={lane} d={mergePath(lane, row.lane)} className={laneClass(lane)} />
                ))}
                {row.hasParent && (
                    <line
                        x1={laneX(row.lane)}
                        y1={DOT_Y}
                        x2={laneX(row.lane)}
                        y2={ROW_HEIGHT}
                        className={laneClass(row.lane)}
                    />
                )}
                <circle
                    cx={laneX(row.lane)}
                    cy={DOT_Y}
                    r={isHead ? 6 : 4.5}
                    className={clsx(laneClass(row.lane), styles.dot, isHead && styles.headDot)}
                />
            </svg>
            <div className={styles.graphTail}>
                <svg width={width} height="100%" viewBox={`0 0 ${width} 1`} preserveAspectRatio="none">
                    {continuingLanes.map((lane) => (
                        <line
                            key={lane}
                            x1={laneX(lane)}
                            y1={0}
                            x2={laneX(lane)}
                            y2={1}
                            vectorEffect="non-scaling-stroke"
                            className={laneClass(lane)}
                        />
                    ))}
                </svg>
            </div>
        </div>
    );
};

export default GraphCell;
