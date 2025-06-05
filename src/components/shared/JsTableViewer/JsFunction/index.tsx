import React from 'react';
import { observer } from 'mobx-react-lite';
import { JsFunction } from '@tdev-components/shared/JsTableViewer/toJsSchema';
import JsType from '@tdev-components/shared/JsTableViewer/JsType';
import CodeBlock from '@theme/CodeBlock';

export interface Props {
    js: JsFunction;
    className?: string;
}

const JsFunction = observer((props: Props) => {
    const { js } = props;

    return (
        <JsType js={js}>
            <CodeBlock language="javascript" className={props.className}>
                {js.value.toString()}
            </CodeBlock>
        </JsType>
    );
});

export default JsFunction;
