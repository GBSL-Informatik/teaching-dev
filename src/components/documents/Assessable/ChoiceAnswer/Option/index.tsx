import React from 'react';
import clsx from 'clsx';
import styles from '../styles.module.scss';
import { observer } from 'mobx-react-lite';
import { useDocument } from '@tdev-hooks/useContextDocument';
import Button from '@tdev-components/shared/Button';
import { mdiTrashCanOutline } from '@mdi/js';

export interface Props {
    children: React.ReactNode;
    optionIndex: number;
}

const Option = observer(({ optionIndex, children }: Props) => {
    const doc = useDocument<'choice_answer'>();
    const optionId = React.useId();
    const isChecked = doc.choices.has(optionIndex);

    const optionOrder = doc.optionsDisplayOrder(optionIndex);
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
                    type={doc.multiple ? 'checkbox' : 'radio'}
                    id={optionId}
                    name={doc.id}
                    onChange={(e) => doc.updateSelection(optionIndex, e.target.checked, doc.multiple)}
                    checked={isChecked}
                    className={styles.checkbox}
                    disabled={!doc?.canUpdateAnswer}
                    tabIndex={optionOrder}
                />
            </div>
            <label htmlFor={optionId}>{children}</label>
            {!doc.multiple && (
                <div className={styles.btnDeleteAnswerContainer}>
                    <Button
                        color="danger"
                        icon={mdiTrashCanOutline}
                        iconSide="left"
                        size={0.7}
                        onClick={() => doc.updateSelection(optionIndex, false)}
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
