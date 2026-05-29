import React from 'react';
import clsx from 'clsx';
import styles from '../styles.module.scss';
import { observer } from 'mobx-react-lite';
import { useDocument } from '@tdev-hooks/useContextDocument';
import Button from '@tdev-components/shared/Button';
import { mdiTrashCanOutline } from '@mdi/js';
import { AssessableType, AssessableTypeModelMapping } from '@tdev-api/document';

export interface Props<T extends AssessableType> {
    type?: T;
    children: React.ReactNode;
    optionIndex: number;
    isChecked: boolean;
    // !! must be a stable reference, otherwise the whole list will re-render on every change
    onChange: (doc: AssessableTypeModelMapping[T], optionIndex: number, checked: boolean) => void;
    optionOrder?: number;
    multiple?: boolean;
}

const Option = observer(<T extends AssessableType>(props: Props<T>) => {
    const doc = useDocument<T>();
    const optionId = React.useId();
    const { children, optionIndex, optionOrder, onChange, isChecked } = props;

    // const optionOrder = props.optionOrder ? props.optionOrder(doc, optionIndex) : doc.optionsDisplayOrder(optionIndex);
    return (
        <div
            key={optionId}
            className={clsx(styles.choiceAnswerOptionContainer)}
            style={{
                order: optionOrder
            }}
        >
            <div className={styles.checkboxContainer}>
                <input
                    type={props.multiple ? 'checkbox' : 'radio'}
                    id={optionId}
                    name={doc.id}
                    onChange={(e) => onChange(doc, optionIndex, e.target.checked)}
                    checked={isChecked}
                    className={styles.checkbox}
                    disabled={!doc?.canUpdateAnswer}
                    tabIndex={optionOrder}
                />
            </div>
            <label htmlFor={optionId}>{children}</label>
            {!props.multiple && (
                <div className={styles.btnDeleteAnswerContainer}>
                    <Button
                        color="danger"
                        icon={mdiTrashCanOutline}
                        iconSide="left"
                        size={0.7}
                        onClick={() => onChange(doc, optionIndex, false)}
                        className={clsx(
                            styles.btnDeleteAnswer,
                            doc?.canUpdateAnswer && isChecked && styles.visible
                        )}
                    />
                </div>
            )}
        </div>
    );
});

export default Option;
