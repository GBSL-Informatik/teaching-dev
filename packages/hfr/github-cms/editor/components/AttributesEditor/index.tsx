import { mdiCodeBraces, mdiCog, mdiPlus, mdiTrashCanOutline } from '@mdi/js';
import Button from '@tdev-components/shared/Button';
import Card from '@tdev-components/shared/Card';
import TextInput from '@tdev-components/shared/TextInput';
import { SIZE_S } from '@tdev-components/shared/iconSizes';
import clsx from 'clsx';
import React from 'react';
import Popup from 'reactjs-popup';
import type { PopupActions } from 'reactjs-popup/dist/types';
import styles from './styles.module.scss';

export interface AttributeRow {
    name: string;
    value: string;
    /** a jsx expression, e.g. `{42}` instead of `"42"` */
    isExpression: boolean;
}

interface Props {
    title: string;
    rows: AttributeRow[];
    onApply: (rows: AttributeRow[]) => void;
    /** jsx supports expressions, directives only support strings */
    allowExpressions?: boolean;
}

/**
 * Edits the attributes of a jsx element or directive. The changes are applied at once,
 * so editing does not create a transaction for every keystroke.
 */
const AttributesEditor = (props: Props) => {
    const ref = React.useRef<PopupActions>(null);
    const [rows, setRows] = React.useState<AttributeRow[]>(props.rows);

    const handleOpen = () => setRows(props.rows);
    const handleChange = (idx: number, change: Partial<AttributeRow>) => {
        setRows((current) => current.map((row, i) => (i === idx ? { ...row, ...change } : row)));
    };
    const handleRemove = (idx: number) => setRows((current) => current.filter((_, i) => i !== idx));
    const handleAdd = () => setRows((current) => [...current, { name: '', value: '', isExpression: false }]);
    const handleApply = (event?: React.KeyboardEvent) => {
        event?.preventDefault();
        props.onApply(rows.filter((row) => row.name.trim()));
        ref.current?.close();
    };

    return (
        <Popup
            trigger={
                <span>
                    <Button icon={mdiCog} size={SIZE_S} title={props.title} />
                </span>
            }
            ref={ref}
            onOpen={handleOpen}
            modal
            on="click"
            nested
            overlayStyle={{ background: 'rgba(0,0,0,0.5)' }}
        >
            <Card
                header={<h4>{props.title}</h4>}
                classNames={{ card: styles.card, footer: styles.footer }}
                footer={
                    <>
                        <Button text="Abbrechen" onClick={() => ref.current?.close()} />
                        <Button text="Übernehmen" color="green" onClick={() => handleApply()} />
                    </>
                }
            >
                <div className={clsx(styles.rows)}>
                    {rows.map((row, idx) => (
                        <React.Fragment key={idx}>
                            <TextInput
                                value={row.name}
                                placeholder="Name"
                                noAutoFocus
                                onChange={(name) => handleChange(idx, { name })}
                            />
                            <TextInput
                                value={row.value}
                                placeholder="Wert"
                                noAutoFocus
                                className={clsx(row.isExpression && styles.expression)}
                                onChange={(value) => handleChange(idx, { value })}
                                onEnter={handleApply}
                            />
                            {props.allowExpressions ? (
                                <Button
                                    icon={mdiCodeBraces}
                                    size={SIZE_S}
                                    active={row.isExpression}
                                    title="Als JavaScript-Ausdruck {...} verwenden"
                                    onClick={() => handleChange(idx, { isExpression: !row.isExpression })}
                                />
                            ) : (
                                <span />
                            )}
                            <Button
                                icon={mdiTrashCanOutline}
                                size={SIZE_S}
                                color="red"
                                title="Attribut entfernen"
                                onClick={() => handleRemove(idx)}
                            />
                        </React.Fragment>
                    ))}
                </div>
                <Button icon={mdiPlus} text="Attribut" iconSide="left" onClick={handleAdd} />
            </Card>
        </Popup>
    );
};

export default AttributesEditor;
