import React from 'react';
import { observer } from 'mobx-react-lite';
import styles from './styles.module.scss';
import clsx from 'clsx';
import JsTypeSwitcher from '../JsType/Switcher';
import iParentable from '../models/iParentable';

export interface Props {
    schema: iParentable;
    className?: string;
    noName?: boolean;
}

const JsSchemaEditor = observer((props: Props) => {
    const { schema } = props;
    return (
        <div className={clsx(styles.js, props.noName && styles.noName, props.className)}>
            {schema.value.map((js) => (
                <JsTypeSwitcher key={js.id} js={js} noName={props.noName} />
            ))}
        </div>
    );
});

export default JsSchemaEditor;
