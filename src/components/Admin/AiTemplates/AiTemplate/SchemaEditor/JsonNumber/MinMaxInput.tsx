import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import { default as JsonNumberModel } from '@tdev-models/Ai/JsonSchema/JsonNumber';
import { action } from 'mobx';
import Button from '@tdev-components/shared/Button';
import { mdiCloseCircleOutline, mdiPlusCircleOutline } from '@mdi/js';
import TextInput from '@tdev-components/shared/TextInput';
import _ from 'lodash';
import { SIZE_XS } from '@tdev-components/shared/iconSizes';

interface Props {
    jsonNumber: JsonNumberModel;
    type: 'minimum' | 'maximum';
}

const MinMaxInput = observer((props: Props) => {
    const { jsonNumber, type } = props;
    const hasValue = typeof jsonNumber[type] === 'number' && !isNaN(jsonNumber[type]);
    return (
        <div className={clsx(styles.minMaxInput, hasValue && styles.hasValue, !hasValue && 'button--block')}>
            {hasValue ? (
                <div className={clsx(styles.input)}>
                    <TextInput
                        type="number"
                        value={`${jsonNumber[type]}`}
                        onChange={action((value) => {
                            if (type === 'maximum') {
                                jsonNumber.setMaximum(Number(value));
                            } else {
                                jsonNumber.setMinimum(Number(value));
                            }
                        })}
                        step={0.01}
                        label={
                            <div className={clsx(styles.label)}>
                                {_.capitalize(type)}
                                <Button
                                    icon={mdiCloseCircleOutline}
                                    color="red"
                                    onClick={action(() => {
                                        jsonNumber.setMinimum(undefined);
                                    })}
                                    size={SIZE_XS}
                                />
                            </div>
                        }
                        noAutoFocus
                    />
                </div>
            ) : (
                <Button
                    icon={mdiPlusCircleOutline}
                    size={SIZE_XS}
                    iconSide={type === 'minimum' ? 'left' : 'right'}
                    color="primary"
                    text={_.capitalize(type)}
                    onClick={action(() => {
                        if (type === 'maximum') {
                            jsonNumber.setMaximum((jsonNumber.minimum ?? 1) + 5);
                        } else {
                            jsonNumber.setMinimum((jsonNumber.maximum ?? 6) - 5);
                        }
                    })}
                />
            )}
        </div>
    );
});
export default MinMaxInput;
