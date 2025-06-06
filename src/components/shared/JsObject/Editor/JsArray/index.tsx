import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import JsType from '../JsType';
import { default as JsArrayModel } from '../models/JsArray';
import JsTypeSwitcher from '../JsType/Switcher';
import AddValue from '../Actions/AddValue';
import JsSchemaEditor from '../JsSchemaEditor';

interface Props {
    js: JsArrayModel;
}

const JsArray = observer((props: Props) => {
    return (
        <JsType js={props.js}>
            <AddValue jsParent={props.js} />
            <div className={clsx(styles.array)}>
                <JsSchemaEditor schema={props.js.value} />

                {/* {props.js.value.map((js) => {
                    return (
                        <div className={clsx(styles.inArray, styles[js.type])} key={js.id}>
                            <JsSchemaEditor schema={[js]} />
                        </div>
                    );
                })} */}
            </div>
        </JsType>
    );
});

export default JsArray;
