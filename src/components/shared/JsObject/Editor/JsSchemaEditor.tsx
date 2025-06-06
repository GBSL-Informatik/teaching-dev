import React from 'react';
import { observer } from 'mobx-react-lite';
import styles from './styles.module.scss';
import clsx from 'clsx';
import JsTypeSwitcher from './JsType/Switcher';
import { JsModelType } from './models/iJs';

export interface Props {
    schema: JsModelType[];
    className?: string;
}

const JsSchemaEditor = observer((props: Props) => {
    return (
        <div className={clsx(styles.js, props.className)}>
            {props.schema.map((js, idx) => (
                <JsTypeSwitcher key={idx} js={js} />
            ))}
        </div>
    );
});

export default JsSchemaEditor;
