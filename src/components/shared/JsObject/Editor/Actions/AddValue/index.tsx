import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import iParentable from '../../models/iParentable';
import {
    mdiCodeBrackets,
    mdiCodeJson,
    mdiFormTextbox,
    mdiFunctionVariant,
    mdiNull,
    mdiNumeric,
    mdiToggleSwitchOffOutline
} from '@mdi/js';
import { JsTypeName, JsValue } from '../../../toJsSchema';
import Button from '@tdev-components/shared/Button';
import { SIZE_XS } from '@tdev-components/shared/iconSizes';
import { ColorMap } from '../../JsType';
import { action } from 'mobx';
import { toModel } from '../../models/toModel';

interface Props {
    jsParent: iParentable;
}

export const IconMap: Record<JsValue['type'], string> = {
    string: mdiFormTextbox,
    number: mdiNumeric,
    array: mdiCodeBrackets,
    object: mdiCodeJson,
    boolean: mdiToggleSwitchOffOutline,
    nullish: mdiNull,
    function: mdiFunctionVariant,
    root: ''
};

const DefaultValue = {
    string: '',
    number: 0,
    array: [],
    object: [],
    boolean: true,
    nullish: undefined,
    function: () => {},
    root: undefined
};

const AddValue = observer((props: Props) => {
    return (
        <div className={clsx(styles.addValue)}>
            {(['string', 'number', 'array', 'object', 'boolean', 'nullish'] as JsTypeName[]).map((type) => (
                <Button
                    key={type}
                    size={SIZE_XS}
                    color={ColorMap[type]}
                    icon={IconMap[type]}
                    iconSide="left"
                    onClick={action((e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        props.jsParent.addValue(
                            toModel(
                                {
                                    type: type,
                                    name: '',
                                    value: DefaultValue[type]
                                } as JsValue,
                                props.jsParent
                            )
                        );
                    })}
                />
            ))}
        </div>
    );
});

export default AddValue;
