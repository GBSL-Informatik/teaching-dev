import React from 'react';
import { observer } from 'mobx-react-lite';
import styles from './styles.module.scss';
import { JsArray as JsonArray } from '@tdev-components/shared/JsTableViewer/toJsSchema';
import JsType from '@tdev-components/shared/JsTableViewer/JsType';
import clsx from 'clsx';
import JsTypeSwitcher from '@tdev-components/shared/JsTableViewer/JsType/Switcher';

interface Props {
    js: JsonArray;
    className?: string;
    nestingLevel: number;
}

const JsonArray = observer((props: Props) => {
    const { js, className } = props;

    return (
        <JsType js={js}>
            <div className={clsx(styles.array, className)}>
                {js.value.map((item, idx) => {
                    return <JsTypeSwitcher key={idx} js={item} nestingLevel={props.nestingLevel + 1} />;
                })}
            </div>
        </JsType>
    );
});

export default JsonArray;
