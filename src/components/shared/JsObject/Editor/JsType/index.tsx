import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import TextInput from '@tdev-components/shared/TextInput';
import { action } from 'mobx';
import _ from 'lodash';
import TextAreaInput from '@tdev-components/shared/TextAreaInput';
import { IfmColors } from '@tdev-components/shared/Colors';
import { mdiTrashCanOutline } from '@mdi/js';
import { SIZE_XS } from '@tdev-components/shared/iconSizes';
import { Confirm } from '@tdev-components/shared/Button/Confirm';
import SelectInput from '@tdev-components/shared/SelectInput';
import iJs from '../models/iJs';
import { JsTypeName } from '../../toJsSchema';

interface Props {
    js: iJs;
    children?: React.ReactNode;
    className?: string;
}

export const ColorMap: { [key in JsTypeName]: keyof typeof IfmColors } = {
    object: 'blue',
    array: 'lightBlue',
    string: 'orange',
    number: 'green',
    boolean: 'gray',
    nullish: 'gray',
    function: 'red',
    root: 'black'
} as const;

const AbbreviatedTypeMap: { [key: string]: JsTypeName } = {
    obj: 'object',
    arr: 'array',
    str: 'string',
    num: 'number',
    boo: 'boolean',
    nul: 'nullish',
    fun: 'function'
} as const;

const JsType = observer((props: Props) => {
    const { js, children } = props;
    return (
        <div
            className={clsx(styles.jsType, props.className)}
            style={{ ['--tdev-json-color' as any]: IfmColors[ColorMap[js.type]] }}
        >
            {js.name && (
                <TextInput
                    value={js.name}
                    onChange={action((value) => {
                        js.setName(value);
                    })}
                    className={clsx(styles.nameInput)}
                    placeholder={`Name`}
                    noAutoFocus
                />
            )}
            <div className={clsx(styles.label)}>
                <Confirm
                    title={js.type}
                    icon={mdiTrashCanOutline}
                    onConfirm={action(() => {
                        js.remove();
                    })}
                    size={SIZE_XS}
                    color={ColorMap[js.type]}
                    className={clsx(styles.remove)}
                    buttonClassName={clsx(styles.removeButton)}
                    confirmColor={'red'}
                    confirmIcon={mdiTrashCanOutline}
                />
                <SelectInput
                    options={['obj', 'arr', 'str', 'num', 'boo', 'nul']}
                    labels={['Object', 'Array', 'String', 'Number', 'Boolean', 'Nullish']}
                    value={js.type.slice(0, 3)}
                    onChange={(val) => {
                        js.changeType(AbbreviatedTypeMap[val as keyof typeof AbbreviatedTypeMap]);
                    }}
                    className={clsx(styles.typeSelect)}
                />
            </div>
            <div className={clsx(styles.children)}>{children}</div>
        </div>
    );
});

export default JsType;
