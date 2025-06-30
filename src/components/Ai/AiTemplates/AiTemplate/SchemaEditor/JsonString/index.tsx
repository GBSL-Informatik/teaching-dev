import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import { default as JsonStringModel } from '@tdev-models/Ai/JsonSchema/JsonString';
import JsonType from '../JsonType';
import { CommonProps } from '..';

interface Props extends CommonProps {
    json: JsonStringModel;
}

const JsonString = observer((props: Props) => {
    return <JsonType {...props} className={clsx(styles.jsonString)}></JsonType>;
});

export default JsonString;
