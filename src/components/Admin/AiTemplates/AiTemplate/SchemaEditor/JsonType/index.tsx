import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import iJson from '@tdev-models/Ai/JsonSchema/iJson';
import TextInput from '@tdev-components/shared/TextInput';
import { action } from 'mobx';
import _ from 'lodash';
import TextAreaInput from '@tdev-components/shared/TextAreaInput';
import { IfmColors } from '@tdev-components/shared/Colors';
import { mdiTrashCanOutline } from '@mdi/js';
import { SIZE_XS } from '@tdev-components/shared/iconSizes';
import { Confirm } from '@tdev-components/shared/Button/Confirm';
import SelectInput from '@tdev-components/shared/SelectInput';

interface Props {
    json: iJson;
    children?: React.ReactNode;
    className?: string;
    noName?: boolean;
    noDelete?: boolean;
    noChangeType?: boolean;
}

export const ColorMap = {
    object: 'blue',
    array: 'lightBlue',
    string: 'orange',
    number: 'green'
} as const;

const AbbreviatedTypeMap = {
    obj: 'object',
    arr: 'array',
    str: 'string',
    num: 'number'
} as const;

const JsonType = observer((props: Props) => {
    const { json, children } = props;
    return (
        <div
            className={clsx(styles.jsonType, props.className)}
            style={{ ['--tdev-json-color' as any]: `var(${IfmColors[ColorMap[json.type]]})` }}
        >
            {!props.noName && (
                <TextInput
                    value={json.name}
                    onChange={action((value) => {
                        json.setName(value);
                    })}
                    className={clsx(styles.nameInput)}
                    placeholder={`Name`}
                    noAutoFocus
                />
            )}
            <div className={clsx(styles.label)}>
                {!props.noDelete && (
                    <Confirm
                        title={json.type}
                        icon={mdiTrashCanOutline}
                        onConfirm={action(() => {
                            json.remove();
                        })}
                        size={SIZE_XS}
                        color={ColorMap[json.type]}
                        className={clsx(styles.remove)}
                        buttonClassName={clsx(styles.removeButton)}
                        confirmColor={'red'}
                        confirmIcon={mdiTrashCanOutline}
                    />
                )}
                {!props.noChangeType && (
                    <SelectInput
                        options={['obj', 'arr', 'str', 'num']}
                        labels={['Object', 'Array', 'String', 'Number']}
                        value={json.type.slice(0, 3)}
                        onChange={(val) => {
                            json.changeType(AbbreviatedTypeMap[val as keyof typeof AbbreviatedTypeMap]);
                        }}
                        className={clsx(styles.typeSelect, props.noDelete && styles.single)}
                    />
                )}
            </div>
            <TextAreaInput
                defaultValue={json.description}
                placeholder="Beschreibung..."
                onChange={action((value) => {
                    json.setDescription(value);
                })}
                className={clsx(styles.descriptionInput)}
                noAutoFocus
            />
            <div className={clsx(styles.children)}>{children}</div>
        </div>
    );
});

export default JsonType;
