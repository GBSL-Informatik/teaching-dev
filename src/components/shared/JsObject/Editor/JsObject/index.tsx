import { mdiChevronDown, mdiChevronRight } from '@mdi/js';
import Button from '@tdev-components/shared/Button';
import { SIZE_XS } from '@tdev-components/shared/iconSizes';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import type { CustomAction } from '..';
import AddValue from '../Actions/AddValue';
import JsType from '../JsType';
import type { default as JsObjectModel } from '../models/JsObject';
import JsSchemaEditor from '../SchemaEditor';
import styles from './styles.module.scss';

interface Props {
    js: JsObjectModel;
    noName?: boolean;
    actions?: CustomAction[];
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
                <AddValue jsParent={js} actions={props.actions} />
            </div>
            {!js.collapsed && (
                <div className={clsx(styles.object, js.parent.isArray && styles.indentValues)}>
                    <JsSchemaEditor schema={js} actions={props.actions} />
                </div>
            )}
        </JsType>
    );
});

export default JsObject;
