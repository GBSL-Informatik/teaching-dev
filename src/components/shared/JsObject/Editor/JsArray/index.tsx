import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import JsType from '../JsType';
import { default as JsArrayModel } from '../models/JsArray';
import JsTypeSwitcher from '../JsType/Switcher';
import AddValue from '../Actions/AddValue';
import JsSchemaEditor from '../SchemaEditor';
import Button from '@tdev-components/shared/Button';
import { mdiChevronDown, mdiChevronRight } from '@mdi/js';
import { SIZE_XS } from '@tdev-components/shared/iconSizes';

interface Props {
    js: JsArrayModel;
    noName?: boolean;
}

const JsArray = observer((props: Props) => {
    const { js } = props;
    return (
        <JsType js={js} noName={props.noName}>
            <div className={clsx(styles.actions)}>
                <Button
                    icon={js.collapsed ? mdiChevronRight : mdiChevronDown}
                    onClick={() => js.setCollapsed(!js.collapsed)}
                    color={js.collapsed ? 'gray' : 'blue'}
                    size={SIZE_XS}
                    className={clsx(styles.collapse)}
                    active={js.collapsed}
                />
                <AddValue jsParent={js} />
            </div>
            {!js.collapsed && (
                <div className={clsx(styles.array, js.parent.type === 'array' && styles.indentValues)}>
                    {js.value.map((js) => {
                        return (
                            <div className={clsx(styles.inArray, styles[js.type])} key={js.id}>
                                <JsTypeSwitcher js={js} noName />
                            </div>
                        );
                    })}
                </div>
            )}
        </JsType>
    );
});

export default JsArray;
