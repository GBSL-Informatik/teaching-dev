import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import Table from '@tdev-components/shared/Table';
import Button from '@tdev-components/shared/Button';

const COLORS = ['primary', 'success', 'warning', 'danger', 'info', 'secondary'] as const;
const IFM_COLORS = [...COLORS.map((c) => `var(--ifm-color-${c}-lightest)`)] as const;

type AssignableColumns = {
    [name: string]: string;
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

    const count = Object.values(toAssign).length;
    const isSingleAssignment = count === 1;
    const [assigned, setAssigned] = React.useState<AssignedColumn[]>(
        isSingleAssignment && table[0].length === 2
            ? [{ id: Object.values(toAssign)[0], idx: 1, name: Object.keys(toAssign)[0] }]
            : []
    );
    const [currentAssignment, setCurrentAssignment] = React.useState<AssignedColumn | null>({
        id: Object.values(toAssign)[0],
        idx: -1,
        name: Object.keys(toAssign)[0]
    });
    React.useEffect(() => {
        onChange(assigned);
    }, [onChange, assigned]);
    const colorIdxMap = new Map(Object.values(toAssign).map((id, idx) => [id, idx % COLORS.length]));

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
                        {Object.entries(toAssign).map(([name, id], idx) => {
                            return (
                                <Button
                                    onClick={() => {
                                        setCurrentAssignment({
                                            id: id,
                                            idx: -1,
                                            name: name
                                        });
                                    }}
                                    text={name || id}
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
                                { id: Object.values(toAssign)[0], idx: idx, name: Object.keys(toAssign)[0] }
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
                        const assignNext = Object.entries(toAssign).find(
                            ([_name, id]) => !assignedIds.has(id)
                        );
                        if (assignNext) {
                            setCurrentAssignment({ id: assignNext[1], idx: -1, name: assignNext[0] });
                        }
                    }
                }}
            />
        </>
    );
};

export default AssignColumns;
