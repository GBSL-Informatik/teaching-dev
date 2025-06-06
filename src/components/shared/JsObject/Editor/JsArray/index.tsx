import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import JsType from '../JsType';
import { default as JsArrayModel } from '../models/JsArray';
import JsTypeSwitcher from '../JsType/Switcher';

interface Props {
    js: JsArrayModel;
}

const JsArray = observer((props: Props) => {
    return (
        <JsType js={props.js} className={clsx(styles.jsonArray)}>
            <div className={clsx(styles.children)}>
                {props.js.value.map((js, idx) => {
                    return <JsTypeSwitcher key={idx} js={js} />;
                })}
            </div>
        </JsType>
    );
});

export default JsArray;
