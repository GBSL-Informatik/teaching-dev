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
import shared from '../styles.module.scss';
import ChangeType from '../Actions/ChangeType';
import RemoveProp from '../Actions/RemoveProp';

interface Props {
    js: iJs;
    actions?: React.ReactNode;
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

const JsType = observer((props: Props) => {
    const { js, children } = props;
    return (
        <>
            <div className={clsx(shared.name, styles.name)}>
                <TextInput
                    value={js.name}
                    onChange={action((value) => {
                        js.setName(value);
                    })}
                    className={clsx(styles.nameInput)}
                    placeholder={`Name`}
                    noAutoFocus
                />
                {props.actions && <div className={clsx(styles.actions)}>{props.actions}</div>}
                <ChangeType js={js} />
                <RemoveProp js={js} />
            </div>
            <div className={clsx(shared.value, styles.children)}>{children}</div>
        </>
    );
});

export default JsType;
