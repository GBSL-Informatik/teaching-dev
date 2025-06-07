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
    mdiPlusCircleOutline,
    mdiToggleSwitchOffOutline
} from '@mdi/js';
import { JsTypeName, JsValue } from '../../../toJsSchema';
import Button from '@tdev-components/shared/Button';
import { SIZE_XS } from '@tdev-components/shared/iconSizes';
import { ColorMap } from '../../JsType';
import { action } from 'mobx';
import { toModel } from '../../models/toModel';
import Icon from '@mdi/react';

interface Props {
    jsParent: iParentable;
    className?: string;
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
        <div className={clsx(styles.addValueContainer, props.className)}>
            <div className={clsx(styles.label)} title="Eigenschaft hinzufügen">
                <Icon
                    path={mdiPlusCircleOutline}
                    size={0.7}
                    className={clsx(styles.addValueIcon)}
                    color="var(--ifm-color-primary)"
                />
            </div>
            <div className={clsx(styles.addValue)}>
                {(['string', 'number', 'array', 'object', 'boolean', 'nullish'] as JsTypeName[]).map(
                    (type) => (
                        <Button
                            key={type}
                            size={SIZE_XS}
                            color={ColorMap[type]}
                            icon={IconMap[type]}
                            iconSide="left"
                            className={clsx(styles.addValueButton)}
                            onClick={action((e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                props.jsParent.addValue(
                                    toModel(
                                        {
                                            type: type,
                                            value: DefaultValue[type]
                                        } as JsValue,
                                        props.jsParent
                                    )
                                );
                            })}
                        />
                    )
                )}
            </div>
        </div>
    );
});

export default AddValue;
