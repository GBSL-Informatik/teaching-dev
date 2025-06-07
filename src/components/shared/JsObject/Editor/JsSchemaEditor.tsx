import React from 'react';
import { observer } from 'mobx-react-lite';
import styles from './styles.module.scss';
import clsx from 'clsx';
import JsTypeSwitcher from './JsType/Switcher';
import { JsModelType } from './models/iJs';

export interface Props {
    schema: JsModelType[];
    className?: string;
    noName?: boolean;
}

const JsSchemaEditor = observer((props: Props) => {
    return (
        <div className={clsx(styles.js, props.noName && styles.noName, props.className)}>
            {props.schema.map((js) => (
                <JsTypeSwitcher key={js.id} js={js} noName={props.noName} />
            ))}
        </div>
    );
});

export default JsSchemaEditor;
