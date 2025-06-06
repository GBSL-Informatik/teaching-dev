import React from 'react';
import { observer } from 'mobx-react-lite';
import styles from './styles.module.scss';
import { JsArray as JsonArray } from '@tdev-components/shared/JsTableViewer/toJsSchema';
import JsType from '@tdev-components/shared/JsTableViewer/JsType';
import clsx from 'clsx';
import JsTypeSwitcher from '@tdev-components/shared/JsTableViewer/JsType/Switcher';
import { CollapseAtContext } from '..';
import Button from '@tdev-components/shared/Button';
import { mdiChevronDown, mdiChevronRight, mdiDotsHorizontal } from '@mdi/js';
import Icon from '@mdi/react';
import { SIZE_XS } from '@tdev-components/shared/iconSizes';

interface Props {
    js: JsonArray;
    className?: string;
    nestingLevel: number;
}

const JsonArray = observer((props: Props) => {
    const { js, className } = props;
    const [collapsed, setCollapsed] = React.useState(false);

    const showToggleCollapse = js.value.length > 1;
    return (
        <JsType
            js={js}
            actions={
                showToggleCollapse ? (
                    <Button
                        icon={collapsed ? mdiChevronRight : mdiChevronDown}
                        color={collapsed ? 'gray' : 'primary'}
                        noOutline={collapsed}
                        size={0.5}
                    />
                ) : undefined
            }
            onClick={
                showToggleCollapse
                    ? () => {
                          setCollapsed((prev) => !prev);
                      }
                    : undefined
            }
        >
            <div className={clsx(styles.array, className)}>
                {showToggleCollapse && collapsed ? (
                    <Icon path={mdiDotsHorizontal} size={SIZE_XS} className={clsx(styles.dots)} />
                ) : (
                    <>
                        {js.value.map((item, idx) => {
                            return (
                                <div className={clsx(styles.inArray, styles[item.type])} key={idx}>
                                    <JsTypeSwitcher js={item} nestingLevel={props.nestingLevel + 1} />
                                </div>
                            );
                        })}
                    </>
                )}
            </div>
        </JsType>
    );
});

export default JsonArray;
