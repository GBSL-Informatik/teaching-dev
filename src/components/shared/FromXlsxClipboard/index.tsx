import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import TextAreaInput from '../TextAreaInput';
import { useStore } from '@tdev-hooks/useStore';
import Button from '../Button';
import Table from '../Table';
import { mdiCheckboxBlankOutline, mdiCheckboxMarked } from '@mdi/js';
import Badge from '../Badge';

interface Props {
    matchUsers?: boolean;
    withoutKnownUsers?: boolean;
    onDone?: (table?: string[][], hasHeader?: boolean) => void;
    toAssign?: string[];
    importLabel?: string;
    cancelLabel?: string;
    cancelIcon?: string;
    /* ensures the returned table has a header row 
        - containing either the provided header infos
        - or default header values
    */
    includeHeader?: boolean;
}

const FromXlsxClipboard = (props: Props) => {
    const [table, setTable] = React.useState<string[][]>([]);
    const [text, setText] = React.useState('');
    const [withHeader, setWithHeader] = React.useState(true);
    const userStore = useStore('userStore');
    React.useEffect(() => {
        const rows = text
            .trim()
            .split('\n')
            .filter((r) => r.trim().length > 0);
        const content = rows
            .map((row, idx) => {
                const cells = row.split('\t');
                if (props.matchUsers) {
                    const user = userStore.managedUsers.find((u) => u.searchRegex.test(row));
                    if (user) {
                        cells.unshift(user.id);
                    } else {
                        if (props.matchUsers && withHeader && idx === 0) {
                            cells.unshift('User ID');
                        } else {
                            cells.unshift('');
                        }
                    }
                }
                return cells;
            })
            .filter((row) => row.length > 0);
        const columns = Math.max(...content.map((c) => c.length));
        content.forEach((row) => {
            while (row.length < columns) {
                row.push('');
            }
        });
        setTable(content);
    }, [text, withHeader]);

    return (
        <div className={clsx(styles.xlsxImport, 'card')}>
            <div className="card__header">
                <h3>Excel-Zellen einfügen</h3>
            </div>
            <div className="card__body">
                <div>
                    Kopierte Excel-Zellen hier per <kbd>Strg</kbd> + <kbd>V</kbd> einfügen.
                </div>
                {props.toAssign && (
                    <div className={clsx(styles.rowsToAssign)}>
                        {props.toAssign.map((col, idx) => (
                            <Badge key={idx} type="info">
                                {col}
                            </Badge>
                        ))}
                    </div>
                )}
                <div className={clsx(styles.main)}>
                    <div className={clsx(styles.input)}>
                        <TextAreaInput
                            onChange={setText}
                            className={clsx(styles.textArea)}
                            placeholder="Excel-Zellen hier einfügen"
                            monospace
                            showTabButton
                            tabClassName={clsx(styles.tabButton)}
                        />
                        <Button
                            icon={withHeader ? mdiCheckboxMarked : mdiCheckboxBlankOutline}
                            onClick={() => setWithHeader(!withHeader)}
                            color={withHeader ? 'green' : 'black'}
                            text="Erste Zeile als Header verwenden"
                            iconSide="left"
                        />
                    </div>
                    <div className={clsx(styles.preview)}>
                        {table.length > 0 && (
                            <Table
                                cells={table}
                                withHeader={withHeader}
                                trimmedCells={{ [0]: 7 }}
                                cellStyler={
                                    props.matchUsers && props.withoutKnownUsers
                                        ? (row, col, val) => {
                                              if (withHeader && row === 0) {
                                                  return;
                                              }
                                              if (table[row][0]) {
                                                  return {
                                                      textDecoration: 'line-through',
                                                      color: 'red'
                                                  };
                                              }
                                          }
                                        : undefined
                                }
                            />
                        )}
                    </div>
                </div>
            </div>
            <div className="card__footer">
                <div className={clsx('button-group', 'button-group--block')}>
                    <Button
                        text={props.cancelIcon ? (undefined as any) : props.cancelLabel || 'Abbrechen'}
                        onClick={() => {
                            if (props.onDone) {
                                props.onDone();
                            }
                        }}
                        icon={props.cancelIcon}
                        title={props.cancelIcon ? props.cancelLabel || 'Abbrechen' : undefined}
                        color="black"
                    />
                    <Button
                        text={props.importLabel || 'Importieren'}
                        onClick={() => {
                            if (props.onDone) {
                                if (props.includeHeader) {
                                    if (withHeader) {
                                        props.onDone(table, true);
                                    } else {
                                        const size = table[0].length;
                                        const hTable = [[], ...table];
                                        for (let i = 0; i < size; i++) {
                                            hTable[0].push(`Spalte ${i + 1}`);
                                        }
                                        props.onDone(hTable, true);
                                    }
                                } else {
                                    props.onDone(table.slice(withHeader ? 1 : 0), false);
                                }
                            }
                        }}
                        disabled={table.length === 0}
                        color="primary"
                    />
                </div>
            </div>
        </div>
    );
};

export default FromXlsxClipboard;
