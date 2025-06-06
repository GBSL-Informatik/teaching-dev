import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import JsType from '../JsType';
import { default as JsNumberModel } from '../models/JsNumber';
import TextInput from '@tdev-components/shared/TextInput';
import { action } from 'mobx';

interface Props {
    js: JsNumberModel;
}
const JsNumber = observer((props: Props) => {
    const { js } = props;
    return (
        <JsType js={js} className={clsx(styles.jsonNumber)}>
            <TextInput
                type="number"
                value={`${js.value}`}
                onChange={action((value) => {
                    js.setValue(Number(value));
                })}
                step={0.01}
                noAutoFocus
            />
        </JsType>
    );
});

export default JsNumber;
