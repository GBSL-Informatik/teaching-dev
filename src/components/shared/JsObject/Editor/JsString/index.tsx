import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import { default as JsonStringModel } from '@tdev-models/Ai/JsonSchema/JsonString';
import JsType from '../JsType';
import { default as JsStringModel } from '../models/JsString';
import TextAreaInput from '@tdev-components/shared/TextAreaInput';

interface Props {
    js: JsStringModel;
}

const JsString = observer((props: Props) => {
    const { js } = props;
    return (
        <JsType js={props.js} className={clsx(styles.jsonString)}>
            <TextAreaInput
                defaultValue={js.value}
                onChange={(value) => {
                    js.setValue(value);
                }}
                placeholder="Text..."
                className={styles.textArea}
                noAutoFocus
            />
        </JsType>
    );
});

export default JsString;
