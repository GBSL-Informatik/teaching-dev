import React from 'react';
import { observer } from 'mobx-react-lite';
import { JsFunction } from '@tdev-components/shared/JsObject/toJsSchema';
import JsType from '@tdev-components/shared/JsObject/Viewer/JsType';
import CodeBlock from '@theme/CodeBlock';
import clsx from 'clsx';
import styles from './styles.module.scss';

export interface Props {
    js: JsFunction;
    className?: string;
}

const JsFunction = observer((props: Props) => {
    const { js } = props;

    return (
        <JsType js={js}>
            <CodeBlock language="javascript" className={clsx(styles.code, props.className)}>
                {js.value.toString()}
            </CodeBlock>
        </JsType>
    );
});

export default JsFunction;
