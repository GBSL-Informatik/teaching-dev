import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import Table from '@tdev-components/shared/Table';
import Button from '@tdev-components/shared/Button';

const COLORS = ['primary', 'success', 'warning', 'danger', 'info', 'secondary'] as const;
const IFM_COLORS = [...COLORS.map((c) => `var(--ifm-color-${c}-lightest)`)] as const;

type AssignableColumns = {
    [name: string]: string[];
};

export interface AssignedColumn {
    id: string;
    idx: number;
    name?: string;
}

interface Props {
    table: string[][];
    toAssign: AssignableColumns;
    onChange: (assigned: AssignedColumn[]) => void;
    trimmedCells?: { [key: number]: number };
    tableClassName?: string;
}

const AssignColumns = (props: Props) => {
    const { table, toAssign, onChange } = props;
    const initialAssignment = React.useMemo(() => {
        const firstRow = table[0] || [];
        if (firstRow.length === 2 && Object.keys(toAssign).length === 1) {
            // if there are only two columns and only one assignment, assign the second column
            return [
                {
                    id: Object.keys(toAssign)[0],
                    idx: 1,
                    name: toAssign[Object.keys(toAssign)[0]]?.[0]
                }
            ];
        }
        const assignments: AssignedColumn[] = [];
        firstRow.forEach((cell, idx) => {
            const match = Object.entries(toAssign).find(([_, possibleValues]) =>
                possibleValues.map((v) => v.toLowerCase()).includes(cell.trim().toLowerCase())
            );
            if (match) {
                assignments.push({ id: match[0], idx: idx, name: match[1][0] });
            }
        });
        return assignments;
    }, []);

    const count = Object.values(toAssign).length;
    const isSingleAssignment = count === 1;
    const [assigned, setAssigned] = React.useState<AssignedColumn[]>(initialAssignment);
    const [currentAssignment, setCurrentAssignment] = React.useState<AssignedColumn | null>({
        id: Object.keys(toAssign)[0],
        idx: -1,
        name: Object.values(toAssign)[0]?.[0]
    });
    React.useEffect(() => {
        onChange(assigned);
    }, [onChange, assigned]);
    const colorIdxMap = new Map(Object.keys(toAssign).map((id, idx) => [id, idx % COLORS.length]));

    return (
        <>
            {currentAssignment && (
                <p>
                    Wähle die zugehörige Spalte für{' '}
                    <span
                        className={clsx('badge', `badge--${COLORS[colorIdxMap.get(currentAssignment.id)!]}`)}
                    >
                        {currentAssignment.name || currentAssignment.id.substring(0, 7)}
                    </span>
                    .
                </p>
            )}
            {count > 1 && (
                <>
                    <div className={clsx(styles.names, 'button-group', 'button--block')}>
                        {Object.entries(toAssign).map(([id, names], idx) => {
                            return (
                                <Button
                                    onClick={() => {
                                        setCurrentAssignment({
                                            id: id,
                                            idx: -1,
                                            name: names[0]
                                        });
                                    }}
                                    text={names[0] || id}
                                    noOutline={currentAssignment?.id === id}
                                    color={COLORS[colorIdxMap.get(id)!]}
                                    key={idx}
                                />
                            );
                        })}
                    </div>
                </>
            )}
            <Table
                cells={table}
                withHeader
                highlightedColumns={assigned.map((a, idx) => ({
                    index: a.idx,
                    color: IFM_COLORS[colorIdxMap.get(a.id)!]
                }))}
                className={clsx(props.tableClassName)}
                trimmedCells={props.trimmedCells}
                onSelectColumn={(idx) => {
                    if (isSingleAssignment) {
                        /**
                         * if there is only one assignment, we can toggle the assignment
                         */
                        if (assigned.find((a) => a.idx === idx)) {
                            setAssigned([]);
                        } else {
                            setAssigned([
                                {
                                    id: Object.keys(toAssign)[0],
                                    idx: idx,
                                    name: Object.values(toAssign)[0]?.[0]
                                }
                            ]);
                        }
                    } else {
                        /**
                         * if there are multiple assignments, we need to assign the current column to the current assignment
                         */
                        if (currentAssignment) {
                            const currentlyAssigned = assigned.find((a) => a.id === currentAssignment.id);
                            if (currentlyAssigned?.idx === idx) {
                                /** toggle the currently assigned item  */
                                setAssigned(assigned.filter((a) => a.id !== currentAssignment.id));
                                return;
                            } else {
                                setAssigned([
                                    ...assigned.filter((a) => a.id !== currentAssignment.id),
                                    {
                                        ...currentAssignment,
                                        idx: idx
                                    }
                                ]);
                            }
                        }
                        const assignedIds = new Set([...assigned.map((a) => a.id), currentAssignment?.id]);
                        const assignNext = Object.keys(toAssign).find((id) => !assignedIds.has(id));
                        if (assignNext) {
                            setCurrentAssignment({
                                id: assignNext,
                                idx: -1,
                                name: toAssign[assignNext]?.[0]
                            });
                        }
                    }
                }}
            />
        </>
    );
};

export default AssignColumns;
