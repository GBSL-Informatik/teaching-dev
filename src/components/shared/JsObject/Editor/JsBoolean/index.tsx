import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import JsType from '../JsType';
import { default as JsBooleanModel } from '../models/JsBoolean';
import TextInput from '@tdev-components/shared/TextInput';
import { action } from 'mobx';
import Button from '@tdev-components/shared/Button';
import { SIZE_XS } from '@tdev-components/shared/iconSizes';

interface Props {
    js: JsBooleanModel;
    noName?: boolean;
}
const JsBoolean = observer((props: Props) => {
    const { js } = props;
    return (
        <JsType js={js} noName={props.noName}>
            <Button
                text={js.value ? 'True' : 'False'}
                onClick={action(() => {
                    js.setValue(!js.value);
                })}
                className={clsx(styles.boolean)}
                color={js.value ? 'blue' : 'secondary'}
                active={!js.value}
                size={SIZE_XS}
            />
        </JsType>
    );
});

export default JsBoolean;
