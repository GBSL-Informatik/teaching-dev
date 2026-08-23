import React from 'react';
import { observer } from 'mobx-react-lite';
import CodeBlock from '@theme/CodeBlock';
import BrowserWindow from '@tdev-components/BrowserWindow';

interface Props {
    code: string;
    imports?: string[];
    children?: React.ReactNode;
    lang?: string;
    lineNumbers?: boolean;
}

const CodeShowcase = observer((props: Props) => {
    const code = props.imports ? `${props.imports.join('\n')}\n\n${props.code}` : props.code;
    return (
        <>
            <CodeBlock language={props.lang} showLineNumbers={props.lineNumbers}>
                {code}
            </CodeBlock>
            <BrowserWindow>{props.children}</BrowserWindow>
        </>
    );
});

export default CodeShowcase;
