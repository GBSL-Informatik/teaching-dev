import React from 'react';
import { observer } from 'mobx-react-lite';
import { JsFunction } from '@tdev-components/shared/JsObject/toJsSchema';
import JsType from '@tdev-components/shared/JsObject/Viewer/JsType';
import CodeBlock from '@theme-original/CodeBlock';
import clsx from 'clsx';
import styles from './styles.module.scss';
import useIsBrowser from '@docusaurus/useIsBrowser';

export interface Props {
    js: JsFunction;
    className?: string;
}

const JsFunction = observer((props: Props) => {
    const { js } = props;
    const isBrowser = useIsBrowser();

    return (
        <JsType js={js}>
            <CodeBlock language="javascript" className={clsx(styles.code, props.className)}>
                {isBrowser ? js.value.toString() : `() => [native code]`}
            </CodeBlock>
        </JsType>
    );
});

export default JsFunction;
