import { mdiChevronDown, mdiChevronRight } from '@mdi/js';
import Button from '@tdev-components/shared/Button';
import { SIZE_XS } from '@tdev-components/shared/iconSizes';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import type { CustomAction } from '..';
import AddValue from '../Actions/AddValue';
import JsType from '../JsType';
import JsTypeSwitcher from '../JsType/Switcher';
import type { default as JsArrayModel } from '../models/JsArray';
import styles from './styles.module.scss';

interface Props {
    js: JsArrayModel;
    noName?: boolean;
    actions?: CustomAction[];
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
                <AddValue jsParent={js} actions={props.actions} />
            </div>
            {!js.collapsed && (
                <div className={clsx(styles.array, js.parent.type === 'array' && styles.indentValues)}>
                    {js.value.map((js) => {
                        return (
                            <div className={clsx(styles.inArray, styles[js.type])} key={js.id}>
                                <JsTypeSwitcher js={js} actions={props.actions} noName />
                            </div>
                        );
                    })}
                </div>
            )}
        </JsType>
    );
});

export default JsArray;
