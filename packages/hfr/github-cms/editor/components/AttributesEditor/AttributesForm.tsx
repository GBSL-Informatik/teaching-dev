import { mdiCodeBraces, mdiPlus, mdiTrashCanOutline } from '@mdi/js';
import Button from '@tdev-components/shared/Button';
import TextInput from '@tdev-components/shared/TextInput';
import { SIZE_S } from '@tdev-components/shared/iconSizes';
import clsx from 'clsx';
import React from 'react';
import styles from './styles.module.scss';

export interface AttributeRow {
    name: string;
    value: string;
    /** a jsx expression, e.g. `{42}` instead of `"42"` */
    isExpression: boolean;
}

interface Props {
    rows: AttributeRow[];
    onApply: (rows: AttributeRow[]) => void;
    /** shows a cancel button */
    onCancel?: () => void;
    /** jsx supports expressions, directives only support strings */
    allowExpressions?: boolean;
    /** changes which are not applied yet are applied when the form is closed, e.g. with its popover */
    applyOnClose?: boolean;
}

const withName = (rows: AttributeRow[]) => rows.filter((row) => row.name.trim());
const isSame = (a: AttributeRow[], b: AttributeRow[]) => JSON.stringify(a) === JSON.stringify(b);

/**
 * Edits the attributes of a jsx element or directive. The changes are applied at once,
 * so editing does not create a transaction for every keystroke.
 */
const AttributesForm = (props: Props) => {
    const [rows, setRows] = React.useState<AttributeRow[]>(props.rows);
    const appliedRows = React.useRef(withName(props.rows));

    const apply = () => {
        appliedRows.current = withName(rows);
        props.onApply(appliedRows.current);
    };

    // reads the latest rows when the form is unmounted. After the node is removed, applying does nothing.
    const applyPending = React.useEffectEvent(() => {
        if (!isSame(withName(rows), appliedRows.current)) {
            apply();
        }
    });
    React.useEffect(() => {
        if (props.applyOnClose) {
            return () => applyPending();
        }
    }, [props.applyOnClose]);

    const handleChange = (idx: number, change: Partial<AttributeRow>) => {
        setRows((current) => current.map((row, i) => (i === idx ? { ...row, ...change } : row)));
    };
    const handleRemove = (idx: number) => setRows((current) => current.filter((_, i) => i !== idx));
    const handleAdd = () => setRows((current) => [...current, { name: '', value: '', isExpression: false }]);
    const handleApply = (event?: React.KeyboardEvent) => {
        event?.preventDefault();
        apply();
    };

    return (
        <>
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
            <div className={clsx(styles.actions)}>
                <Button icon={mdiPlus} text="Attribut" iconSide="left" onClick={handleAdd} />
                <span className={clsx(styles.spacer)} />
                {props.onCancel && <Button text="Abbrechen" onClick={props.onCancel} />}
                <Button text="Übernehmen" color="green" onClick={() => handleApply()} />
            </div>
        </>
    );
};

export default AttributesForm;
