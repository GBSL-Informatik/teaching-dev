import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import { default as JsonNumberModel } from '@tdev-models/Ai/JsonSchema/JsonNumber';
import JsonType from '../JsonType';
import _ from 'lodash';
import MinMaxInput from './MinMaxInput';
import { CommonProps } from '..';

interface Props extends CommonProps {
    json: JsonNumberModel;
}
const JsonNumber = observer((props: Props) => {
    const { json } = props;
    return (
        <JsonType {...props} className={clsx(styles.jsonNumber)}>
            <div className={clsx(styles.actions)}>
                <MinMaxInput jsonNumber={json} type="minimum" />
                <MinMaxInput jsonNumber={json} type="maximum" />
            </div>
        </JsonType>
    );
});

export default JsonNumber;
