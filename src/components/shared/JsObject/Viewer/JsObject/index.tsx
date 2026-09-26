import { mdiChevronDown, mdiChevronRight, mdiDotsHorizontal } from '@mdi/js';
import Icon from '@mdi/react';
import Button from '@tdev-components/shared/Button';
import { SIZE_XS } from '@tdev-components/shared/iconSizes';
import { JsObject as JsObjectType } from '@tdev-components/shared/JsObject/toJsSchema';
import { CollapseAtContext } from '@tdev-components/shared/JsObject/Viewer';
import JsSchemaViewer from '@tdev-components/shared/JsObject/Viewer/JsSchemaViewer';
import JsType from '@tdev-components/shared/JsObject/Viewer/JsType';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import React from 'react';
import styles from './styles.module.scss';

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
