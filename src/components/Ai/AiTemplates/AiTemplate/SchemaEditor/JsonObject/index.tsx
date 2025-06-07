import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import { default as JsonObjectModel } from '@tdev-models/Ai/JsonSchema/JsonObject';
import JsonType, { ColorMap } from '../JsonType';
import { action } from 'mobx';
import SchemaEditor from '..';
import Button from '@tdev-components/shared/Button';
import { mdiChevronDown, mdiChevronRight, mdiPlusCircleOutline } from '@mdi/js';
import { SIZE_XS } from '@tdev-components/shared/iconSizes';
import { CommonProps } from '..';

interface Props extends CommonProps {
    json: JsonObjectModel;
}

const JsonObject = observer((props: Props) => {
    const { json } = props;
    return (
        <JsonType {...props} className={clsx(styles.jsonObject)}>
            <div className={clsx('button-group', styles.actions)}>
                <Button
                    icon={json.collapsed ? mdiChevronRight : mdiChevronDown}
                    onClick={() => json.setCollapsed(!json.collapsed)}
                    color="blue"
                    size={SIZE_XS}
                />
                {(['string', 'number', 'array', 'object'] as const).map((type) => (
                    <Button
                        key={type}
                        text={type}
                        size={SIZE_XS}
                        color={ColorMap[type]}
                        icon={mdiPlusCircleOutline}
                        iconSide="left"
                        onClick={action(() => {
                            json.createProperty(type);
                        })}
                    />
                ))}
            </div>
            {!json.collapsed && (
                <div className={clsx(styles.children)}>
                    {json.properties.map((prop, idx) => (
                        <SchemaEditor key={idx} json={prop} />
                    ))}
                </div>
            )}
        </JsonType>
    );
});

export default JsonObject;
