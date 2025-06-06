import React from 'react';
import { observer } from 'mobx-react-lite';
import JsType from '@tdev-components/shared/JsTableViewer/JsType';
import { JsObject as JsObjectType } from '@tdev-components/shared/JsTableViewer/toJsSchema';
import JsSchemaViewer from '@tdev-components/shared/JsTableViewer/JsSchemaViewer';
import Button from '@tdev-components/shared/Button';
import { mdiChevronDown, mdiChevronRight, mdiDotsHorizontal } from '@mdi/js';
import Icon from '@mdi/react';
import { SIZE_XS } from '@tdev-components/shared/iconSizes';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { CollapseAtContext } from '@tdev-components/shared/JsTableViewer';

interface Props {
    js: JsObjectType;
    className?: string;
    nestingLevel: number;
}

const JsObject = observer((props: Props) => {
    const { js } = props;
    const collapseAt = React.useContext<number | undefined>(CollapseAtContext);
    const [collapsed, setCollapsed] = React.useState(props.nestingLevel > (collapseAt ?? 3));
    if (js.name === undefined) {
        return <JsSchemaViewer schema={js.value} nestingLevel={props.nestingLevel + 1} />;
    }

    const showToggleCollapse = js.value.length > 1;

    return (
        <JsType
            {...props}
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
            {showToggleCollapse && collapsed ? (
                <Icon path={mdiDotsHorizontal} size={SIZE_XS} className={clsx(styles.dots)} />
            ) : (
                <JsSchemaViewer schema={js.value} nestingLevel={props.nestingLevel + 1} />
            )}
        </JsType>
    );
});

export default JsObject;
