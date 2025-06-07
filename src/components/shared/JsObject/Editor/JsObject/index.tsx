import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import JsType, { ColorMap } from '../JsType';
import { action } from 'mobx';
import JsObjectEditor from '..';
import Button from '@tdev-components/shared/Button';
import { mdiChevronDown, mdiChevronRight, mdiPlusCircleOutline } from '@mdi/js';
import { SIZE_XS } from '@tdev-components/shared/iconSizes';
import { default as JsObjectModel } from '../models/JsObject';
import { JsTypeName } from '../../toJsSchema';
import JsSchemaEditor from '../JsSchemaEditor';
import AddValue from '../Actions/AddValue';

interface Props {
    js: JsObjectModel;
    noName?: boolean;
}

const JsObject = observer((props: Props) => {
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
                <div className={clsx(styles.object, js.parent.isArray && styles.indentValues)}>
                    <JsSchemaEditor schema={js.value} />
                </div>
            )}
        </JsType>
    );
});

export default JsObject;
