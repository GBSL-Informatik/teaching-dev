import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import TextInput from '@tdev-components/shared/TextInput';
import { action } from 'mobx';
import _ from 'es-toolkit/compat';
import { IfmColors } from '@tdev-components/shared/Colors';
import iJs from '../models/iJs';
import { JsTypeName } from '../../toJsSchema';
import ChangeType from '../Actions/ChangeType';
import RemoveProp from '../Actions/RemoveProp';

interface Props {
    js: iJs;
    children?: React.ReactNode;
    noName?: boolean;
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
            {!props.noName && (
                <div className={clsx(styles.name)}>
                    <TextInput
                        value={js.name}
                        onChange={action((value) => {
                            js.setName(value);
                        })}
                        className={clsx(styles.nameInput)}
                        placeholder={`Name`}
                        readOnly={!js.canEditName}
                        noAutoFocus
                    />
                    <div className={clsx(styles.dirtyIndicator, js.isDirty && styles.dirty)}>*</div>
                </div>
            )}
            <div className={clsx(styles.value, styles[js.type])}>
                <div className={clsx(styles.input)}>{children}</div>
                <div className={clsx(styles.stickyActions)}>
                    <div className={clsx(styles.actions)}>
                        <ChangeType js={js} />
                        <RemoveProp js={js} />
                    </div>
                </div>
            </div>
        </>
    );
});

export default JsType;
