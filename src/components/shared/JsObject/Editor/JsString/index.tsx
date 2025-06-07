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
    noName?: boolean;
}

const JsString = observer((props: Props) => {
    const { js } = props;
    return (
        <JsType js={js} noName={props.noName}>
            <div className={clsx(styles.jsString)}>
                <TextAreaInput
                    defaultValue={js.value}
                    onChange={(value) => {
                        js.setValue(value);
                    }}
                    placeholder="Text..."
                    className={clsx(styles.textArea, styles.string)}
                    noAutoFocus
                />
            </div>
        </JsType>
    );
});

export default JsString;
