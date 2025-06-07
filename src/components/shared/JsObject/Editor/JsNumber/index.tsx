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
    noName?: boolean;
}
const JsNumber = observer((props: Props) => {
    const { js } = props;
    return (
        <JsType js={js} noName={props.noName}>
            <TextInput
                type="number"
                value={`${js.value}`}
                onChange={action((value) => {
                    js.setValue(Number(value));
                })}
                step={0.01}
                className={clsx(styles.jsNumber)}
                noAutoFocus
            />
        </JsType>
    );
});

export default JsNumber;
