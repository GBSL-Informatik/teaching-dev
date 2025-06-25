import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import JsType from '../JsType';
import { default as JsNullishModel } from '../models/JsNullish';
import { action } from 'mobx';
import Button from '@tdev-components/shared/Button';

interface Props {
    js: JsNullishModel;
    noName?: boolean;
}
const JsNullish = observer((props: Props) => {
    const { js } = props;
    return (
        <JsType js={js} noName={props.noName}>
            <Button
                text={js.value === null ? 'Null' : 'Undefined'}
                onClick={action(() => {
                    js.setValue(js.value === null ? undefined : null);
                })}
                className={clsx(styles.nullish)}
                color="gray"
                active
            />
        </JsType>
    );
});

export default JsNullish;
