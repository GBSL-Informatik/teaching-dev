import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import { default as JsonArrayModel } from '@tdev-models/Ai/JsonSchema/JsonArray';
import JsonType from '../JsonType';
import SchemaEditor from '..';
import { CommonProps } from '..';

interface Props extends CommonProps {
    json: JsonArrayModel;
}

const JsonArray = observer((props: Props) => {
    const { json } = props;
    return (
        <JsonType {...props} className={clsx(styles.jsonArray)}>
            <div className={clsx(styles.children)}>
                <SchemaEditor json={json.items} noName noDelete />
            </div>
        </JsonType>
    );
});

export default JsonArray;
