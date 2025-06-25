import React from 'react';
import { observer } from 'mobx-react-lite';
import { JsValue } from '@tdev-components/shared/JsObject/toJsSchema';
import JsTypeSwitcher from '@tdev-components/shared/JsObject/Viewer/JsType/Switcher';
import styles from './styles.module.scss';
import clsx from 'clsx';

export interface Props {
    schema: JsValue[];
    className?: string;
    nestingLevel: number;
}

const JsSchemaViewer = observer((props: Props) => {
    return (
        <div className={clsx(styles.js, props.className)}>
            {props.schema.map((js, idx) => (
                <JsTypeSwitcher key={idx} js={js} nestingLevel={props.nestingLevel} />
            ))}
        </div>
    );
});

export default JsSchemaViewer;
